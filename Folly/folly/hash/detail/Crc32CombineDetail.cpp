/*
 * Copyright 2018-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <folly/hash/detail/ChecksumDetail.h>

#include <array>

#include <folly/Bits.h>
#include <folly/ConstexprMath.h>

namespace folly {

// Standard galois-field multiply.  The only modification is that a,
// b, m, and p are all bit-reflected.
//
// https://en.wikipedia.org/wiki/Finite_field_arithmetic
static constexpr uint32_t
gf_multiply_sw_1(size_t i, uint32_t p, uint32_t a, uint32_t b, uint32_t m) {
  // clang-format off
  return i == 32 ? p : gf_multiply_sw_1(
      /* i = */ i + 1,
      /* p = */ p ^ (-((b >> 31) & 1) & a),
      /* a = */ (a >> 1) ^ (-(a & 1) & m),
      /* b = */ b << 1,
      /* m = */ m);
  // clang-format on
}
static constexpr uint32_t gf_multiply_sw(uint32_t a, uint32_t b, uint32_t m) {
  return gf_multiply_sw_1(/* i = */ 0, /* p = */ 0, a, b, m);
}

static constexpr uint32_t gf_square_sw(uint32_t a, uint32_t m) {
  return gf_multiply_sw(a, a, m);
}

namespace {

template <size_t i, uint32_t m>
struct gf_powers_memo {
  static constexpr uint32_t value =
      gf_square_sw(gf_powers_memo<i - 1, m>::value, m);
};
template <uint32_t m>
struct gf_powers_memo<0, m> {
  static constexpr uint32_t value = m;
};

template <uint32_t m>
struct gf_powers_make {
  template <size_t... i>
  constexpr auto operator()(index_sequence<i...>) const {
    return std::array<uint32_t, sizeof...(i)>{{gf_powers_memo<i, m>::value...}};
  }
};

} // namespace

#if FOLLY_SSE_PREREQ(4, 2)

// Reduction taken from
// https://www.nicst.de/crc.pdf
//
// This is an intrinsics-based implementation of listing 3.
static uint32_t gf_multiply_crc32c_hw(uint64_t crc1, uint64_t crc2, uint32_t) {
  const auto crc1_xmm = _mm_set_epi64x(0, crc1);
  const auto crc2_xmm = _mm_set_epi64x(0, crc2);
  const auto count = _mm_set_epi64x(0, 1);
  const auto res0 = _mm_clmulepi64_si128(crc2_xmm, crc1_xmm, 0x00);
  const auto res1 = _mm_sll_epi64(res0, count);

  // Use hardware crc32c to do reduction from 64 -> 32 bytes
  const auto res2 = _mm_cvtsi128_si64(res1);
  const auto res3 = _mm_crc32_u32(0, res2);
  const auto res4 = _mm_extract_epi32(res1, 1);
  return res3 ^ res4;
}

static uint32_t gf_multiply_crc32_hw(uint64_t crc1, uint64_t crc2, uint32_t) {
  const auto crc1_xmm = _mm_set_epi64x(0, crc1);
  const auto crc2_xmm = _mm_set_epi64x(0, crc2);
  const auto count = _mm_set_epi64x(0, 1);
  const auto res0 = _mm_clmulepi64_si128(crc2_xmm, crc1_xmm, 0x00);
  const auto res1 = _mm_sll_epi64(res0, count);

  // Do barrett reduction of 64 -> 32 bytes
  const auto mask32 = _mm_set_epi32(0, 0, 0, 0xFFFFFFFF);
  const auto barrett_reduction_constants =
      _mm_set_epi32(0x1, 0xDB710641, 0x1, 0xF7011641);
  const auto res2 = _mm_clmulepi64_si128(
      _mm_and_si128(res1, mask32), barrett_reduction_constants, 0x00);
  const auto res3 = _mm_clmulepi64_si128(
      _mm_and_si128(res2, mask32), barrett_reduction_constants, 0x10);
  return _mm_cvtsi128_si32(_mm_srli_si128(_mm_xor_si128(res3, res1), 4));
}

#else

static uint32_t gf_multiply_crc32c_hw(uint64_t, uint64_t, uint32_t) {
  return 0;
}
static uint32_t gf_multiply_crc32_hw(uint64_t, uint64_t, uint32_t) {
  return 0;
}

#endif

static constexpr uint32_t crc32c_m = 0x82f63b78;
static constexpr uint32_t crc32_m = 0xedb88320;

/*
 * Pre-calculated powers tables for crc32c and crc32.
 */
static constexpr std::array<uint32_t, 62> const crc32c_powers =
    gf_powers_make<crc32c_m>{}(make_index_sequence<62>{});
static constexpr std::array<uint32_t, 62> const crc32_powers =
    gf_powers_make<crc32_m>{}(make_index_sequence<62>{});

template <typename F>
static uint32_t crc32_append_zeroes(
    F mult,
    uint32_t crc,
    size_t len,
    uint32_t polynomial,
    std::array<uint32_t, 62> const& powers_array) {
  auto powers = powers_array.data();

  // Append by multiplying by consecutive powers of two of the zeroes
  // array
  len >>= 2;

  while (len) {
    // Advance directly to next bit set.
    auto r = findFirstSet(len) - 1;
    len >>= r;
    powers += r;

    crc = mult(crc, *powers, polynomial);

    len >>= 1;
    powers++;
  }

  return crc;
}

namespace detail {

uint32_t crc32_combine_sw(uint32_t crc1, uint32_t crc2, size_t crc2len) {
  return crc2 ^
      crc32_append_zeroes(gf_multiply_sw, crc1, crc2len, crc32_m, crc32_powers);
}

uint32_t crc32_combine_hw(uint32_t crc1, uint32_t crc2, size_t crc2len) {
  return crc2 ^
      crc32_append_zeroes(
             gf_multiply_crc32_hw, crc1, crc2len, crc32_m, crc32_powers);
}

uint32_t crc32c_combine_sw(uint32_t crc1, uint32_t crc2, size_t crc2len) {
  return crc2 ^
      crc32_append_zeroes(
             gf_multiply_sw, crc1, crc2len, crc32c_m, crc32c_powers);
}

uint32_t crc32c_combine_hw(uint32_t crc1, uint32_t crc2, size_t crc2len) {
  return crc2 ^
      crc32_append_zeroes(
             gf_multiply_crc32c_hw, crc1, crc2len, crc32c_m, crc32c_powers);
}

} // namespace detail

} // namespace folly
