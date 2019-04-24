/*
 * Copyright 2011-present Facebook, Inc.
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

// @author Tudor Bosman (tudorb@fb.com)

#include <algorithm>
#include <random>
#include <vector>

#include <folly/Random.h>
#include <folly/lang/Bits.h>

#include <folly/portability/GTest.h>

using namespace folly;

// Test constexpr-ness.
#if !defined(__clang__) && !defined(_MSC_VER)
static_assert(findFirstSet(2u) == 2, "findFirstSet");
static_assert(findLastSet(2u) == 2, "findLastSet");
static_assert(nextPowTwo(2u) == 2, "nextPowTwo");
#endif

#ifndef __clang__
static_assert(isPowTwo(2u), "isPowTwo");
#endif

namespace {

template <class INT>
void testFFS() {
  EXPECT_EQ(0, findFirstSet(static_cast<INT>(0)));
  size_t bits =
      std::numeric_limits<typename std::make_unsigned<INT>::type>::digits;
  for (size_t i = 0; i < bits; i++) {
    INT v = (static_cast<INT>(1) << (bits - 1)) | (static_cast<INT>(1) << i);
    EXPECT_EQ(i + 1, findFirstSet(v));
  }
}

template <class INT>
void testFLS() {
  typedef typename std::make_unsigned<INT>::type UINT_T;
  EXPECT_EQ(0, findLastSet(static_cast<INT>(0)));
  size_t bits = std::numeric_limits<UINT_T>::digits;
  for (size_t i = 0; i < bits; i++) {
    INT v1 = static_cast<UINT_T>(1) << i;
    EXPECT_EQ(i + 1, findLastSet(v1));

    INT v2 = (static_cast<UINT_T>(1) << i) - 1;
    EXPECT_EQ(i, findLastSet(v2));
  }
}

} // namespace

TEST(Bits, FindFirstSet) {
  testFFS<char>();
  testFFS<signed char>();
  testFFS<unsigned char>();
  testFFS<short>();
  testFFS<unsigned short>();
  testFFS<int>();
  testFFS<unsigned int>();
  testFFS<long>();
  testFFS<unsigned long>();
  testFFS<long long>();
  testFFS<unsigned long long>();
}

TEST(Bits, FindLastSet) {
  testFLS<char>();
  testFLS<signed char>();
  testFLS<unsigned char>();
  testFLS<short>();
  testFLS<unsigned short>();
  testFLS<int>();
  testFLS<unsigned int>();
  testFLS<long>();
  testFLS<unsigned long>();
  testFLS<long long>();
  testFLS<unsigned long long>();
}

TEST(Bits, nextPowTwoClz) {
  EXPECT_EQ(1, nextPowTwo(0u));
  EXPECT_EQ(1, nextPowTwo(1u));
  EXPECT_EQ(2, nextPowTwo(2u));
  EXPECT_EQ(4, nextPowTwo(3u));
  EXPECT_EQ(4, nextPowTwo(4u));
  EXPECT_EQ(8, nextPowTwo(5u));
  EXPECT_EQ(8, nextPowTwo(6u));
  EXPECT_EQ(8, nextPowTwo(7u));
  EXPECT_EQ(8, nextPowTwo(8u));
  EXPECT_EQ(16, nextPowTwo(9u));
  EXPECT_EQ(16, nextPowTwo(13u));
  EXPECT_EQ(16, nextPowTwo(16u));
  EXPECT_EQ(512, nextPowTwo(510u));
  EXPECT_EQ(512, nextPowTwo(511u));
  EXPECT_EQ(512, nextPowTwo(512u));
  EXPECT_EQ(1024, nextPowTwo(513u));
  EXPECT_EQ(1024, nextPowTwo(777u));
  EXPECT_EQ(1ul << 31, nextPowTwo((1ul << 31) - 1));
  EXPECT_EQ(1ull << 32, nextPowTwo((1ull << 32) - 1));
  EXPECT_EQ(1ull << 63, nextPowTwo((1ull << 62) + 1));
}

TEST(Bits, prevPowTwoClz) {
  EXPECT_EQ(0, prevPowTwo(0u));
  EXPECT_EQ(1, prevPowTwo(1u));
  EXPECT_EQ(2, prevPowTwo(2u));
  EXPECT_EQ(2, prevPowTwo(3u));
  EXPECT_EQ(4, prevPowTwo(4u));
  EXPECT_EQ(4, prevPowTwo(5u));
  EXPECT_EQ(4, prevPowTwo(6u));
  EXPECT_EQ(4, prevPowTwo(7u));
  EXPECT_EQ(8, prevPowTwo(8u));
  EXPECT_EQ(8, prevPowTwo(9u));
  EXPECT_EQ(8, prevPowTwo(13u));
  EXPECT_EQ(16, prevPowTwo(16u));
  EXPECT_EQ(256, prevPowTwo(510u));
  EXPECT_EQ(256, prevPowTwo(511u));
  EXPECT_EQ(512, prevPowTwo(512u));
  EXPECT_EQ(512, prevPowTwo(513u));
  EXPECT_EQ(512, prevPowTwo(777u));
  EXPECT_EQ(1ul << 30, prevPowTwo((1ul << 31) - 1));
  EXPECT_EQ(1ull << 31, prevPowTwo((1ull << 32) - 1));
  EXPECT_EQ(1ull << 62, prevPowTwo((1ull << 62) + 1));
}

TEST(Bits, isPowTwo) {
  EXPECT_FALSE(isPowTwo(0u));
  EXPECT_TRUE(isPowTwo(1ul));
  EXPECT_TRUE(isPowTwo(2ull));
  EXPECT_FALSE(isPowTwo(3ul));
  EXPECT_TRUE(isPowTwo(4ul));
  EXPECT_FALSE(isPowTwo(5ul));
  EXPECT_TRUE(isPowTwo(8ul));
  EXPECT_FALSE(isPowTwo(15u));
  EXPECT_TRUE(isPowTwo(16u));
  EXPECT_FALSE(isPowTwo(17u));
  EXPECT_FALSE(isPowTwo(511ul));
  EXPECT_TRUE(isPowTwo(512ul));
  EXPECT_FALSE(isPowTwo(513ul));
  EXPECT_FALSE(isPowTwo((1ul << 31) - 1));
  EXPECT_TRUE(isPowTwo(1ul << 31));
  EXPECT_FALSE(isPowTwo((1ul << 31) + 1));
  EXPECT_FALSE(isPowTwo((1ull << 63) - 1));
  EXPECT_TRUE(isPowTwo(1ull << 63));
  EXPECT_FALSE(isPowTwo((1ull << 63) + 1));
}

TEST(Bits, popcount) {
  EXPECT_EQ(0, popcount(0U));
  EXPECT_EQ(1, popcount(1U));
  EXPECT_EQ(32, popcount(uint32_t(-1)));
  EXPECT_EQ(64, popcount(uint64_t(-1)));
}

TEST(Bits, Endian_swap_uint) {
  EXPECT_EQ(uint8_t(0xda), Endian::swap(uint8_t(0xda)));
  EXPECT_EQ(uint16_t(0x4175), Endian::swap(uint16_t(0x7541)));
  EXPECT_EQ(uint32_t(0x42efb918), Endian::swap(uint32_t(0x18b9ef42)));
  EXPECT_EQ(
      uint64_t(0xa244f5e862c71d8a), Endian::swap(uint64_t(0x8a1dc762e8f544a2)));
}

TEST(Bits, Endian_swap_real) {
  std::mt19937_64 rng;
  auto f = std::uniform_real_distribution<float>()(rng);
  EXPECT_NE(f, Endian::swap(f));
  EXPECT_EQ(f, Endian::swap(Endian::swap(f)));
  auto d = std::uniform_real_distribution<double>()(rng);
  EXPECT_NE(d, Endian::swap(d));
  EXPECT_EQ(d, Endian::swap(Endian::swap(d)));
}

uint64_t reverse_simple(uint64_t v) {
  uint64_t r = 0;

  for (int i = 0; i < 64; i++) {
    r <<= 1;
    r |= v & 1;
    v >>= 1;
  }
  return r;
}

TEST(Bits, BitReverse) {
  EXPECT_EQ(folly::bitReverse<uint8_t>(0), 0);
  EXPECT_EQ(folly::bitReverse<uint8_t>(1), 128);
  for (int i = 0; i < 100; i++) {
    uint64_t v = folly::Random::rand64();
    EXPECT_EQ(folly::bitReverse(v), reverse_simple(v));
    uint32_t b = folly::Random::rand32();
    EXPECT_EQ(folly::bitReverse(b), reverse_simple(b) >> 32);
  }
}

TEST(Bits, PartialLoadUnaligned) {
  std::vector<char> buf(128);
  std::generate(
      buf.begin(), buf.end(), [] { return folly::Random::rand32(255); });
  for (size_t l = 0; l < 8; ++l) {
    for (size_t pos = 0; pos <= buf.size() - l; ++pos) {
      auto p = buf.data() + pos;
      auto x = folly::partialLoadUnaligned<uint64_t>(p, l);

      uint64_t expected = 0;
      memcpy(&expected, p, l);

      EXPECT_EQ(x, expected);

      if (l < 4) {
        auto x32 = folly::partialLoadUnaligned<uint32_t>(p, l);
        EXPECT_EQ(x32, static_cast<uint32_t>(expected));
      }
    }
  }
}
