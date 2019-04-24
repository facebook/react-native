/*
 * crc32_impl.h
 *
 * Copyright 2016 Eric Biggers
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * CRC-32 folding with PCLMULQDQ.
 *
 * The basic idea is to repeatedly "fold" each 512 bits into the next
 * 512 bits, producing an abbreviated message which is congruent the
 * original message modulo the generator polynomial G(x).
 *
 * Folding each 512 bits is implemented as eight 64-bit folds, each of
 * which uses one carryless multiplication instruction.  It's expected
 * that CPUs may be able to execute some of these multiplications in
 * parallel.
 *
 * Explanation of "folding": let A(x) be 64 bits from the message, and
 * let B(x) be 95 bits from a constant distance D later in the
 * message.  The relevant portion of the message can be written as:
 *
 *      M(x) = A(x)*x^D + B(x)
 *
 * ... where + and * represent addition and multiplication,
 * respectively, of polynomials over GF(2).  Note that when
 * implemented on a computer, these operations are equivalent to XOR
 * and carryless multiplication, respectively.
 *
 * For the purpose of CRC calculation, only the remainder modulo the
 * generator polynomial G(x) matters:
 *
 * M(x) mod G(x) = (A(x)*x^D + B(x)) mod G(x)
 *
 * Since the modulo operation can be applied anywhere in a sequence of
 * additions and multiplications without affecting the result, this is
 * equivalent to:
 *
 * M(x) mod G(x) = (A(x)*(x^D mod G(x)) + B(x)) mod G(x)
 *
 * For any D, 'x^D mod G(x)' will be a polynomial with maximum degree
 * 31, i.e.  a 32-bit quantity.  So 'A(x) * (x^D mod G(x))' is
 * equivalent to a carryless multiplication of a 64-bit quantity by a
 * 32-bit quantity, producing a 95-bit product.  Then, adding
 * (XOR-ing) the product to B(x) produces a polynomial with the same
 * length as B(x) but with the same remainder as 'A(x)*x^D + B(x)'.
 * This is the basic fold operation with 64 bits.
 *
 * Note that the carryless multiplication instruction PCLMULQDQ
 * actually takes two 64-bit inputs and produces a 127-bit product in
 * the low-order bits of a 128-bit XMM register.  This works fine, but
 * care must be taken to account for "bit endianness".  With the CRC
 * version implemented here, bits are always ordered such that the
 * lowest-order bit represents the coefficient of highest power of x
 * and the highest-order bit represents the coefficient of the lowest
 * power of x.  This is backwards from the more intuitive order.
 * Still, carryless multiplication works essentially the same either
 * way.  It just must be accounted for that when we XOR the 95-bit
 * product in the low-order 95 bits of a 128-bit XMM register into
 * 128-bits of later data held in another XMM register, we'll really
 * be XOR-ing the product into the mathematically higher degree end of
 * those later bits, not the lower degree end as may be expected.
 *
 * So given that caveat and the fact that we process 512 bits per
 * iteration, the 'D' values we need for the two 64-bit halves of each
 * 128 bits of data are:
 *
 * D = (512 + 95) - 64 for the higher-degree half of each 128
 *                 bits, i.e. the lower order bits in
 *                 the XMM register
 *
 *    D = (512 + 95) - 128 for the lower-degree half of each 128
 *                 bits, i.e. the higher order bits in
 *                 the XMM register
 *
 * The required 'x^D mod G(x)' values were precomputed.
 *
 * When <= 512 bits remain in the message, we finish up by folding
 * across smaller distances.  This works similarly; the distance D is
 * just different, so different constant multipliers must be used.
 * Finally, once the remaining message is just 64 bits, it is is
 * reduced to the CRC-32 using Barrett reduction (explained later).
 *
 * For more information see the original paper from Intel: "Fast CRC
 *    Computation for Generic Polynomials Using PCLMULQDQ
 *    Instruction" December 2009
 *    http://www.intel.com/content/dam/www/public/us/en/documents/
 *    white-papers/
 *    fast-crc-computation-generic-polynomials-pclmulqdq-paper.pdf
 */

#include <folly/hash/detail/ChecksumDetail.h>

namespace folly {
namespace detail {

#if FOLLY_SSE_PREREQ(4, 2)

uint32_t
crc32_hw_aligned(uint32_t remainder, const __m128i* p, size_t vec_count) {
  /* Constants precomputed by gen_crc32_multipliers.c.  Do not edit! */
  const __m128i multipliers_4 = _mm_set_epi32(0, 0x1D9513D7, 0, 0x8F352D95);
  const __m128i multipliers_2 = _mm_set_epi32(0, 0x81256527, 0, 0xF1DA05AA);
  const __m128i multipliers_1 = _mm_set_epi32(0, 0xCCAA009E, 0, 0xAE689191);
  const __m128i final_multiplier = _mm_set_epi32(0, 0, 0, 0xB8BC6765);
  const __m128i mask32 = _mm_set_epi32(0, 0, 0, 0xFFFFFFFF);
  const __m128i barrett_reduction_constants =
      _mm_set_epi32(0x1, 0xDB710641, 0x1, 0xF7011641);

  const __m128i* const end = p + vec_count;
  const __m128i* const end512 = p + (vec_count & ~3);
  __m128i x0, x1, x2, x3;

  /*
   * Account for the current 'remainder', i.e. the CRC of the part of
   * the message already processed.  Explanation: rewrite the message
   * polynomial M(x) in terms of the first part A(x), the second part
   * B(x), and the length of the second part in bits |B(x)| >= 32:
   *
   *    M(x) = A(x)*x^|B(x)| + B(x)
   *
   * Then the CRC of M(x) is:
   *
   *    CRC(M(x)) = CRC(A(x)*x^|B(x)| + B(x))
   *              = CRC(A(x)*x^32*x^(|B(x)| - 32) + B(x))
   *              = CRC(CRC(A(x))*x^(|B(x)| - 32) + B(x))
   *
   * Note: all arithmetic is modulo G(x), the generator polynomial; that's
   * why A(x)*x^32 can be replaced with CRC(A(x)) = A(x)*x^32 mod G(x).
   *
   * So the CRC of the full message is the CRC of the second part of the
   * message where the first 32 bits of the second part of the message
   * have been XOR'ed with the CRC of the first part of the message.
   */
  x0 = *p++;
  x0 = _mm_xor_si128(x0, _mm_set_epi32(0, 0, 0, remainder));

  if (p > end512) /* only 128, 256, or 384 bits of input? */
    goto _128_bits_at_a_time;
  x1 = *p++;
  x2 = *p++;
  x3 = *p++;

  /* Fold 512 bits at a time */
  for (; p != end512; p += 4) {
    __m128i y0, y1, y2, y3;

    y0 = p[0];
    y1 = p[1];
    y2 = p[2];
    y3 = p[3];

    /*
     * Note: the immediate constant for PCLMULQDQ specifies which
     * 64-bit halves of the 128-bit vectors to multiply:
     *
     * 0x00 means low halves (higher degree polynomial terms for us)
     * 0x11 means high halves (lower degree polynomial terms for us)
     */
    y0 = _mm_xor_si128(y0, _mm_clmulepi64_si128(x0, multipliers_4, 0x00));
    y1 = _mm_xor_si128(y1, _mm_clmulepi64_si128(x1, multipliers_4, 0x00));
    y2 = _mm_xor_si128(y2, _mm_clmulepi64_si128(x2, multipliers_4, 0x00));
    y3 = _mm_xor_si128(y3, _mm_clmulepi64_si128(x3, multipliers_4, 0x00));
    y0 = _mm_xor_si128(y0, _mm_clmulepi64_si128(x0, multipliers_4, 0x11));
    y1 = _mm_xor_si128(y1, _mm_clmulepi64_si128(x1, multipliers_4, 0x11));
    y2 = _mm_xor_si128(y2, _mm_clmulepi64_si128(x2, multipliers_4, 0x11));
    y3 = _mm_xor_si128(y3, _mm_clmulepi64_si128(x3, multipliers_4, 0x11));

    x0 = y0;
    x1 = y1;
    x2 = y2;
    x3 = y3;
  }

  /* Fold 512 bits => 128 bits */
  x2 = _mm_xor_si128(x2, _mm_clmulepi64_si128(x0, multipliers_2, 0x00));
  x3 = _mm_xor_si128(x3, _mm_clmulepi64_si128(x1, multipliers_2, 0x00));
  x2 = _mm_xor_si128(x2, _mm_clmulepi64_si128(x0, multipliers_2, 0x11));
  x3 = _mm_xor_si128(x3, _mm_clmulepi64_si128(x1, multipliers_2, 0x11));
  x3 = _mm_xor_si128(x3, _mm_clmulepi64_si128(x2, multipliers_1, 0x00));
  x3 = _mm_xor_si128(x3, _mm_clmulepi64_si128(x2, multipliers_1, 0x11));
  x0 = x3;

_128_bits_at_a_time:
  while (p != end) {
    /* Fold 128 bits into next 128 bits */
    x1 = *p++;
    x1 = _mm_xor_si128(x1, _mm_clmulepi64_si128(x0, multipliers_1, 0x00));
    x1 = _mm_xor_si128(x1, _mm_clmulepi64_si128(x0, multipliers_1, 0x11));
    x0 = x1;
  }

  /* Now there are just 128 bits left, stored in 'x0'. */

  /*
   * Fold 128 => 96 bits.  This also implicitly appends 32 zero bits,
   * which is equivalent to multiplying by x^32.  This is needed because
   * the CRC is defined as M(x)*x^32 mod G(x), not just M(x) mod G(x).
   */
  x0 = _mm_xor_si128(
      _mm_srli_si128(x0, 8), _mm_clmulepi64_si128(x0, multipliers_1, 0x10));

  /* Fold 96 => 64 bits */
  x0 = _mm_xor_si128(
      _mm_srli_si128(x0, 4),
      _mm_clmulepi64_si128(_mm_and_si128(x0, mask32), final_multiplier, 0x00));

  /*
   * Finally, reduce 64 => 32 bits using Barrett reduction.
   *
   * Let M(x) = A(x)*x^32 + B(x) be the remaining message.  The goal is to
   * compute R(x) = M(x) mod G(x).  Since degree(B(x)) < degree(G(x)):
   *
   *    R(x) = (A(x)*x^32 + B(x)) mod G(x)
   *         = (A(x)*x^32) mod G(x) + B(x)
   *
   * Then, by the Division Algorithm there exists a unique q(x) such that:
   *
   *    A(x)*x^32 mod G(x) = A(x)*x^32 - q(x)*G(x)
   *
   * Since the left-hand side is of maximum degree 31, the right-hand side
   * must be too.  This implies that we can apply 'mod x^32' to the
   * right-hand side without changing its value:
   *
   *    (A(x)*x^32 - q(x)*G(x)) mod x^32 = q(x)*G(x) mod x^32
   *
   * Note that '+' is equivalent to '-' in polynomials over GF(2).
   *
   * We also know that:
   *
   *                  / A(x)*x^32 \
   *    q(x) = floor (  ---------  )
   *                  \    G(x)   /
   *
   * To compute this efficiently, we can multiply the top and bottom by
   * x^32 and move the division by G(x) to the top:
   *
   *                  / A(x) * floor(x^64 / G(x)) \
   *    q(x) = floor (  -------------------------  )
   *                  \           x^32            /
   *
   * Note that floor(x^64 / G(x)) is a constant.
   *
   * So finally we have:
   *
   *                              / A(x) * floor(x^64 / G(x)) \
   *    R(x) = B(x) + G(x)*floor (  -------------------------  )
   *                              \           x^32            /
   */
  x1 = x0;
  x0 = _mm_clmulepi64_si128(
      _mm_and_si128(x0, mask32), barrett_reduction_constants, 0x00);
  x0 = _mm_clmulepi64_si128(
      _mm_and_si128(x0, mask32), barrett_reduction_constants, 0x10);
  return _mm_cvtsi128_si32(_mm_srli_si128(_mm_xor_si128(x0, x1), 4));
}

#endif
} // namespace detail
} // namespace folly
