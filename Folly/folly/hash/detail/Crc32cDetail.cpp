/*
 * Copyright 2016 Ferry Toth, Exalon Delft BV, The Netherlands
 *  This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the author be held liable for any damages
 * arising from the use of this software.
 *  Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *  1. The origin of this software must not be misrepresented; you must not
 *   claim that you wrote the original software. If you use this software
 *   in a product, an acknowledgment in the product documentation would be
 *   appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *   misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 *  Ferry Toth
 * ftoth@exalondelft.nl
 *
 * https://github.com/htot/crc32c
 *
 * Modified by Facebook
 *
 * Original intel whitepaper:
 * "Fast CRC Computation for iSCSI Polynomial Using CRC32 Instruction"
 * https://www.intel.com/content/dam/www/public/us/en/documents/white-papers/crc-iscsi-polynomial-crc32-instruction-paper.pdf
 *
 * 32-bit support dropped
 * use intrinsics instead of inline asm
 * other code cleanup
 */

#include <stdexcept>

#include <folly/hash/detail/ChecksumDetail.h>

#include <folly/CppAttributes.h>

#include <boost/preprocessor/arithmetic/add.hpp>
#include <boost/preprocessor/arithmetic/sub.hpp>
#include <boost/preprocessor/repetition/repeat_from_to.hpp>

namespace folly {
namespace detail {

#if defined(FOLLY_X64) && FOLLY_SSE_PREREQ(4, 2)

namespace crc32_detail {

#define CRCtriplet(crc, buf, offset)                  \
  crc##0 = _mm_crc32_u64(crc##0, *(buf##0 + offset)); \
  crc##1 = _mm_crc32_u64(crc##1, *(buf##1 + offset)); \
  crc##2 = _mm_crc32_u64(crc##2, *(buf##2 + offset)); \
  FOLLY_FALLTHROUGH;

#define CRCduplet(crc, buf, offset)                   \
  crc##0 = _mm_crc32_u64(crc##0, *(buf##0 + offset)); \
  crc##1 = _mm_crc32_u64(crc##1, *(buf##1 + offset));

#define CRCsinglet(crc, buf, offset)                    \
  crc = _mm_crc32_u64(crc, *(uint64_t*)(buf + offset)); \
  FOLLY_FALLTHROUGH;

#define CASEREPEAT_TRIPLET(unused, count, total)    \
  case BOOST_PP_ADD(1, BOOST_PP_SUB(total, count)): \
    CRCtriplet(crc, next, -BOOST_PP_ADD(1, BOOST_PP_SUB(total, count)));

#define CASEREPEAT_SINGLET(unused, count, total) \
  case BOOST_PP_SUB(total, count):               \
    CRCsinglet(crc0, next, -BOOST_PP_SUB(total, count) * 8);

// Numbers taken directly from intel whitepaper.
// clang-format off
const uint64_t clmul_constants[] = {
    0x14cd00bd6, 0x105ec76f0, 0x0ba4fc28e, 0x14cd00bd6,
    0x1d82c63da, 0x0f20c0dfe, 0x09e4addf8, 0x0ba4fc28e,
    0x039d3b296, 0x1384aa63a, 0x102f9b8a2, 0x1d82c63da,
    0x14237f5e6, 0x01c291d04, 0x00d3b6092, 0x09e4addf8,
    0x0c96cfdc0, 0x0740eef02, 0x18266e456, 0x039d3b296,
    0x0daece73e, 0x0083a6eec, 0x0ab7aff2a, 0x102f9b8a2,
    0x1248ea574, 0x1c1733996, 0x083348832, 0x14237f5e6,
    0x12c743124, 0x02ad91c30, 0x0b9e02b86, 0x00d3b6092,
    0x018b33a4e, 0x06992cea2, 0x1b331e26a, 0x0c96cfdc0,
    0x17d35ba46, 0x07e908048, 0x1bf2e8b8a, 0x18266e456,
    0x1a3e0968a, 0x11ed1f9d8, 0x0ce7f39f4, 0x0daece73e,
    0x061d82e56, 0x0f1d0f55e, 0x0d270f1a2, 0x0ab7aff2a,
    0x1c3f5f66c, 0x0a87ab8a8, 0x12ed0daac, 0x1248ea574,
    0x065863b64, 0x08462d800, 0x11eef4f8e, 0x083348832,
    0x1ee54f54c, 0x071d111a8, 0x0b3e32c28, 0x12c743124,
    0x0064f7f26, 0x0ffd852c6, 0x0dd7e3b0c, 0x0b9e02b86,
    0x0f285651c, 0x0dcb17aa4, 0x010746f3c, 0x018b33a4e,
    0x1c24afea4, 0x0f37c5aee, 0x0271d9844, 0x1b331e26a,
    0x08e766a0c, 0x06051d5a2, 0x093a5f730, 0x17d35ba46,
    0x06cb08e5c, 0x11d5ca20e, 0x06b749fb2, 0x1bf2e8b8a,
    0x1167f94f2, 0x021f3d99c, 0x0cec3662e, 0x1a3e0968a,
    0x19329634a, 0x08f158014, 0x0e6fc4e6a, 0x0ce7f39f4,
    0x08227bb8a, 0x1a5e82106, 0x0b0cd4768, 0x061d82e56,
    0x13c2b89c4, 0x188815ab2, 0x0d7a4825c, 0x0d270f1a2,
    0x10f5ff2ba, 0x105405f3e, 0x00167d312, 0x1c3f5f66c,
    0x0f6076544, 0x0e9adf796, 0x026f6a60a, 0x12ed0daac,
    0x1a2adb74e, 0x096638b34, 0x19d34af3a, 0x065863b64,
    0x049c3cc9c, 0x1e50585a0, 0x068bce87a, 0x11eef4f8e,
    0x1524fa6c6, 0x19f1c69dc, 0x16cba8aca, 0x1ee54f54c,
    0x042d98888, 0x12913343e, 0x1329d9f7e, 0x0b3e32c28,
    0x1b1c69528, 0x088f25a3a, 0x02178513a, 0x0064f7f26,
    0x0e0ac139e, 0x04e36f0b0, 0x0170076fa, 0x0dd7e3b0c,
    0x141a1a2e2, 0x0bd6f81f8, 0x16ad828b4, 0x0f285651c,
    0x041d17b64, 0x19425cbba, 0x1fae1cc66, 0x010746f3c,
    0x1a75b4b00, 0x18db37e8a, 0x0f872e54c, 0x1c24afea4,
    0x01e41e9fc, 0x04c144932, 0x086d8e4d2, 0x0271d9844,
    0x160f7af7a, 0x052148f02, 0x05bb8f1bc, 0x08e766a0c,
    0x0a90fd27a, 0x0a3c6f37a, 0x0b3af077a, 0x093a5f730,
    0x04984d782, 0x1d22c238e, 0x0ca6ef3ac, 0x06cb08e5c,
    0x0234e0b26, 0x063ded06a, 0x1d88abd4a, 0x06b749fb2,
    0x04597456a, 0x04d56973c, 0x0e9e28eb4, 0x1167f94f2,
    0x07b3ff57a, 0x19385bf2e, 0x0c9c8b782, 0x0cec3662e,
    0x13a9cba9e, 0x0e417f38a, 0x093e106a4, 0x19329634a,
    0x167001a9c, 0x14e727980, 0x1ddffc5d4, 0x0e6fc4e6a,
    0x00df04680, 0x0d104b8fc, 0x02342001e, 0x08227bb8a,
    0x00a2a8d7e, 0x05b397730, 0x168763fa6, 0x0b0cd4768,
    0x1ed5a407a, 0x0e78eb416, 0x0d2c3ed1a, 0x13c2b89c4,
    0x0995a5724, 0x1641378f0, 0x19b1afbc4, 0x0d7a4825c,
    0x109ffedc0, 0x08d96551c, 0x0f2271e60, 0x10f5ff2ba,
    0x00b0bf8ca, 0x00bf80dd2, 0x123888b7a, 0x00167d312,
    0x1e888f7dc, 0x18dcddd1c, 0x002ee03b2, 0x0f6076544,
    0x183e8d8fe, 0x06a45d2b2, 0x133d7a042, 0x026f6a60a,
    0x116b0f50c, 0x1dd3e10e8, 0x05fabe670, 0x1a2adb74e,
    0x130004488, 0x0de87806c, 0x000bcf5f6, 0x19d34af3a,
    0x18f0c7078, 0x014338754, 0x017f27698, 0x049c3cc9c,
    0x058ca5f00, 0x15e3e77ee, 0x1af900c24, 0x068bce87a,
    0x0b5cfca28, 0x0dd07448e, 0x0ded288f8, 0x1524fa6c6,
    0x059f229bc, 0x1d8048348, 0x06d390dec, 0x16cba8aca,
    0x037170390, 0x0a3e3e02c, 0x06353c1cc, 0x042d98888,
    0x0c4584f5c, 0x0d73c7bea, 0x1f16a3418, 0x1329d9f7e,
    0x0531377e2, 0x185137662, 0x1d8d9ca7c, 0x1b1c69528,
    0x0b25b29f2, 0x18a08b5bc, 0x19fb2a8b0, 0x02178513a,
    0x1a08fe6ac, 0x1da758ae0, 0x045cddf4e, 0x0e0ac139e,
    0x1a91647f2, 0x169cf9eb0, 0x1a0f717c4, 0x0170076fa,
};
// clang-format on

/*
 * CombineCRC performs pclmulqdq multiplication of 2 partial CRC's and a well
 * chosen constant and xor's these with the remaining CRC.
 */
uint64_t CombineCRC(
    size_t block_size,
    uint64_t crc0,
    uint64_t crc1,
    uint64_t crc2,
    const uint64_t* next2) {
  const auto multiplier =
      *(reinterpret_cast<const __m128i*>(clmul_constants) + block_size - 1);
  const auto crc0_xmm = _mm_set_epi64x(0, crc0);
  const auto res0 = _mm_clmulepi64_si128(crc0_xmm, multiplier, 0x00);
  const auto crc1_xmm = _mm_set_epi64x(0, crc1);
  const auto res1 = _mm_clmulepi64_si128(crc1_xmm, multiplier, 0x10);
  const auto res = _mm_xor_si128(res0, res1);
  crc0 = _mm_cvtsi128_si64(res);
  crc0 = crc0 ^ *((uint64_t*)next2 - 1);
  crc2 = _mm_crc32_u64(crc2, crc0);
  return crc2;
}

// Generates a block that will crc up to 7 bytes of unaligned data.
// Always inline to avoid overhead on small crc sizes.
FOLLY_ALWAYS_INLINE void align_to_8(
    size_t align,
    uint64_t& crc0, // crc so far, updated on return
    const unsigned char*& next) { // next data pointer, updated on return
  uint32_t crc32bit = static_cast<uint32_t>(crc0);
  if (align & 0x04) {
    crc32bit = _mm_crc32_u32(crc32bit, *(uint32_t*)next);
    next += sizeof(uint32_t);
  }
  if (align & 0x02) {
    crc32bit = _mm_crc32_u16(crc32bit, *(uint16_t*)next);
    next += sizeof(uint16_t);
  }
  if (align & 0x01) {
    crc32bit = _mm_crc32_u8(crc32bit, *(next));
    next++;
  }
  crc0 = crc32bit;
}

// The main loop for large crc sizes. Generates three crc32c
// streams, of varying block sizes, using a duff's device.
void triplet_loop(
    size_t block_size,
    uint64_t& crc0, // crc so far, updated on return
    const unsigned char*& next, // next data pointer, updated on return
    size_t n) { // block count
  uint64_t crc1 = 0, crc2 = 0;
  // points to the first byte of the next block
  const uint64_t* next0 = (uint64_t*)next + block_size;
  const uint64_t* next1 = next0 + block_size;
  const uint64_t* next2 = next1 + block_size;

  // Use Duff's device, a for() loop inside a switch()
  // statement. This needs to execute at least once, round len
  // down to nearest triplet multiple
  switch (block_size) {
    case 128:
      do {
        // jumps here for a full block of len 128
        CRCtriplet(crc, next, -128);

        // Generates case statements from 127 to 2 of form:
        // case 127:
        //    CRCtriplet(crc, next, -127);
        //
        // MSVC has a max preprocessor expansion depth of 255, which is
        // exceeded if this is a single statement.
        BOOST_PP_REPEAT_FROM_TO(0, 64, CASEREPEAT_TRIPLET, 126);
        BOOST_PP_REPEAT_FROM_TO(0, 62, CASEREPEAT_TRIPLET, 62);

        // For the last byte, the three crc32c streams must be combined
        // using carry-less multiplication.
        case 1:
          CRCduplet(crc, next, -1); // the final triplet is actually only 2
          crc0 = CombineCRC(block_size, crc0, crc1, crc2, next2);
          if (--n > 0) {
            crc1 = crc2 = 0;
            block_size = 128;
            // points to the first byte of the next block
            next0 = next2 + 128;
            next1 = next0 + 128; // from here on all blocks are 128 long
            next2 = next1 + 128;
          }
          FOLLY_FALLTHROUGH;
        case 0:;
      } while (n > 0);
  }

  next = (const unsigned char*)next2;
}

} // namespace crc32_detail

/* Compute CRC-32C using the Intel hardware instruction. */
FOLLY_TARGET_ATTRIBUTE("sse4.2")
uint32_t crc32c_hw(const uint8_t* buf, size_t len, uint32_t crc) {
  const unsigned char* next = (const unsigned char*)buf;
  size_t count;
  uint64_t crc0;
  crc0 = crc;

  if (len >= 8) {
    // if len > 216 then align and use triplets
    if (len > 216) {
      size_t align = (8 - (uintptr_t)next) & 7;
      crc32_detail::align_to_8(align, crc0, next);
      len -= align;

      count = len / 24; // number of triplets
      len %= 24; // bytes remaining
      size_t n = count >> 7; // #blocks = first block + full blocks
      size_t block_size = count & 127;
      if (block_size == 0) {
        block_size = 128;
      } else {
        n++;
      }

      // This is a separate function call mainly to stop
      // clang from spilling registers.
      crc32_detail::triplet_loop(block_size, crc0, next, n);
    }

    size_t count2 = len >> 3;
    len = len & 7;
    next += (count2 * 8);

    // Generates a duff device for the last 128 bytes of aligned data.
    switch (count2) {
      // Generates case statements of the form:
      // case 27:
      //   CRCsinglet(crc0, next, -27 * 8);
      BOOST_PP_REPEAT_FROM_TO(0, 27, CASEREPEAT_SINGLET, 27);
      case 0:;
    }
  }

  // compute the crc for up to seven trailing bytes
  crc32_detail::align_to_8(len, crc0, next);
  return (uint32_t)crc0;
}

#else

uint32_t
crc32c_hw(const uint8_t* /* buf */, size_t /* len */, uint32_t /* crc */) {
  throw std::runtime_error("crc32_hw is not implemented on this platform");
}

#endif

} // namespace detail
} // namespace folly
