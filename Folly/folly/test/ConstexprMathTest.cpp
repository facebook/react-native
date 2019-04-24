/*
 * Copyright 2017-present Facebook, Inc.
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

#include <folly/ConstexprMath.h>

#include <limits>
#include <type_traits>

#include <folly/lang/Bits.h>
#include <folly/portability/GTest.h>

namespace {
class ConstexprMathTest : public testing::Test {};
} // namespace

TEST_F(ConstexprMathTest, constexpr_min) {
  constexpr auto x = uint16_t(3);
  constexpr auto y = uint16_t(7);
  constexpr auto z = uint16_t(4);
  constexpr auto a = folly::constexpr_min(x, y, z);
  EXPECT_EQ(3, a);
  EXPECT_TRUE((std::is_same<const uint16_t, decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_max) {
  constexpr auto x = uint16_t(3);
  constexpr auto y = uint16_t(7);
  constexpr auto z = uint16_t(4);
  constexpr auto a = folly::constexpr_max(x, y, z);
  EXPECT_EQ(7, a);
  EXPECT_TRUE((std::is_same<const uint16_t, decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_clamp) {
  constexpr auto lo = uint16_t(3);
  constexpr auto hi = uint16_t(7);
  constexpr auto x = folly::constexpr_clamp(uint16_t(2), lo, hi);
  constexpr auto y = folly::constexpr_clamp(uint16_t(5), lo, hi);
  constexpr auto z = folly::constexpr_clamp(uint16_t(8), lo, hi);
  EXPECT_EQ(3, x);
  EXPECT_EQ(5, y);
  EXPECT_EQ(7, z);
  EXPECT_TRUE((std::is_same<const uint16_t, decltype(y)>::value));
}

TEST_F(ConstexprMathTest, constexpr_abs_unsigned) {
  constexpr auto v = uint32_t(17);
  constexpr auto a = folly::constexpr_abs(v);
  EXPECT_EQ(17, a);
  EXPECT_TRUE((std::is_same<const uint32_t, decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_abs_signed_positive) {
  constexpr auto v = int32_t(17);
  constexpr auto a = folly::constexpr_abs(v);
  EXPECT_EQ(17, a);
  EXPECT_TRUE((std::is_same<const uint32_t, decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_abs_signed_negative) {
  constexpr auto v = int32_t(-17);
  constexpr auto a = folly::constexpr_abs(v);
  EXPECT_EQ(17, a);
  EXPECT_TRUE((std::is_same<const uint32_t, decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_abs_float_positive) {
  constexpr auto v = 17.5f;
  constexpr auto a = folly::constexpr_abs(v);
  EXPECT_EQ(17.5, a);
  EXPECT_TRUE((std::is_same<const float, decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_abs_float_negative) {
  constexpr auto v = -17.5f;
  constexpr auto a = folly::constexpr_abs(v);
  EXPECT_EQ(17.5, a);
  EXPECT_TRUE((std::is_same<const float, decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_abs_double_positive) {
  constexpr auto v = 17.5;
  constexpr auto a = folly::constexpr_abs(v);
  EXPECT_EQ(17.5, a);
  EXPECT_TRUE((std::is_same<const double, decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_abs_double_negative) {
  constexpr auto v = -17.5;
  constexpr auto a = folly::constexpr_abs(v);
  EXPECT_EQ(17.5, a);
  EXPECT_TRUE((std::is_same<const double, decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_log2_1) {
  constexpr auto v = 1ull;
  constexpr auto a = folly::constexpr_log2(v);
  EXPECT_EQ(0ull, a);
  EXPECT_TRUE((std::is_same<decltype(v), decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_log2_2) {
  constexpr auto v = 2ull;
  constexpr auto a = folly::constexpr_log2(v);
  EXPECT_EQ(1ull, a);
  EXPECT_TRUE((std::is_same<decltype(v), decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_log2_64) {
  constexpr auto v = 64ull;
  constexpr auto a = folly::constexpr_log2(v);
  EXPECT_EQ(6ull, a);
  EXPECT_TRUE((std::is_same<decltype(v), decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_log2_ceil_1) {
  constexpr auto v = 1ull;
  constexpr auto a = folly::constexpr_log2_ceil(v);
  EXPECT_EQ(0ull, a);
  EXPECT_TRUE((std::is_same<decltype(v), decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_log2_ceil_2) {
  constexpr auto v = 2ull;
  constexpr auto a = folly::constexpr_log2_ceil(v);
  EXPECT_EQ(1ull, a);
  EXPECT_TRUE((std::is_same<decltype(v), decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_log2_ceil_3) {
  constexpr auto v = 3ull;
  constexpr auto a = folly::constexpr_log2_ceil(v);
  EXPECT_EQ(2ull, a);
  EXPECT_TRUE((std::is_same<decltype(v), decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_log2_ceil_63) {
  constexpr auto v = 63ull;
  constexpr auto a = folly::constexpr_log2_ceil(v);
  EXPECT_EQ(6ull, a);
  EXPECT_TRUE((std::is_same<decltype(v), decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_log2_ceil_64) {
  constexpr auto v = 64ull;
  constexpr auto a = folly::constexpr_log2_ceil(v);
  EXPECT_EQ(6ull, a);
  EXPECT_TRUE((std::is_same<decltype(v), decltype(a)>::value));
}

TEST_F(ConstexprMathTest, constexpr_ceil) {
  {
    constexpr auto roundable = 20ull;
    constexpr auto round = 6ull;
    constexpr auto rounded = folly::constexpr_ceil(roundable, round);
    EXPECT_EQ(24ull, rounded);
  }
  {
    constexpr auto roundable = -20ll;
    constexpr auto round = 6ll;
    constexpr auto rounded = folly::constexpr_ceil(roundable, round);
    EXPECT_EQ(-18ll, rounded);
  }
  {
    constexpr auto roundable = -20ll;
    constexpr auto round = 0ll;
    constexpr auto rounded = folly::constexpr_ceil(roundable, round);
    EXPECT_EQ(-20ll, rounded);
  }
}

TEST_F(ConstexprMathTest, constexpr_pow) {
  {
    constexpr auto a = folly::constexpr_pow(uint64_t(0), 15);
    EXPECT_EQ(0, a);
  }
  {
    constexpr auto a = folly::constexpr_pow(uint64_t(15), 0);
    EXPECT_EQ(1, a);
  }
  {
    constexpr auto a = folly::constexpr_pow(uint64_t(2), 6);
    EXPECT_EQ(64, a);
  }
}

TEST_F(ConstexprMathTest, constexpr_find_last_set_examples) {
  {
    constexpr auto a = folly::constexpr_find_last_set(int64_t(0));
    EXPECT_EQ(0, a);
  }
  {
    constexpr auto a = folly::constexpr_find_last_set(int64_t(2));
    EXPECT_EQ(2, a);
  }
  {
    constexpr auto a = folly::constexpr_find_last_set(int64_t(4096 + 64));
    EXPECT_EQ(13, a);
  }
}

TEST_F(ConstexprMathTest, constexpr_find_last_set_all_64_adjacents) {
  using type = uint64_t;
  constexpr auto const bits = std::numeric_limits<type>::digits;
  EXPECT_EQ(0, folly::constexpr_find_last_set(type(0)));
  for (size_t i = 0; i < bits; ++i) {
    type const v = type(1) << i;
    EXPECT_EQ(i + 1, folly::constexpr_find_last_set(v));
    EXPECT_EQ(i, folly::constexpr_find_last_set((v - 1)));
  }
}

TEST_F(ConstexprMathTest, constexpr_find_last_set_all_8_reference) {
  using type = char;
  for (size_t i = 0; i < 256u; ++i) {
    auto const expected = folly::findLastSet(type(i));
    EXPECT_EQ(expected, folly::constexpr_find_last_set(type(i)));
  }
}

TEST_F(ConstexprMathTest, constexpr_find_first_set_examples) {
  {
    constexpr auto a = folly::constexpr_find_first_set(int64_t(0));
    EXPECT_EQ(0, a);
  }
  {
    constexpr auto a = folly::constexpr_find_first_set(int64_t(2));
    EXPECT_EQ(2, a);
  }
  {
    constexpr auto a = folly::constexpr_find_first_set(int64_t(4096 + 64));
    EXPECT_EQ(7, a);
  }
}

TEST_F(ConstexprMathTest, constexpr_find_first_set_all_64_adjacent) {
  using type = uint64_t;
  constexpr auto const bits = std::numeric_limits<type>::digits;
  EXPECT_EQ(0, folly::constexpr_find_first_set(type(0)));
  for (size_t i = 0; i < bits; ++i) {
    type const v = (type(1) << (bits - 1)) | (type(1) << i);
    EXPECT_EQ(i + 1, folly::constexpr_find_first_set(v));
  }
}

TEST_F(ConstexprMathTest, constexpr_find_first_set_all_8_reference) {
  using type = char;
  for (size_t i = 0; i < 256u; ++i) {
    auto const expected = folly::findFirstSet(type(i));
    EXPECT_EQ(expected, folly::constexpr_find_first_set(type(i)));
  }
}

constexpr auto kInt64Max = std::numeric_limits<int64_t>::max();
constexpr auto kInt64Min = std::numeric_limits<int64_t>::min();
constexpr auto kUInt64Max = std::numeric_limits<uint64_t>::max();
constexpr auto kInt8Max = std::numeric_limits<int8_t>::max();
constexpr auto kInt8Min = std::numeric_limits<int8_t>::min();
constexpr auto kUInt8Max = std::numeric_limits<uint8_t>::max();

TEST_F(ConstexprMathTest, constexpr_add_overflow_clamped) {
  for (int a = kInt8Min; a <= kInt8Max; a++) {
    for (int b = kInt8Min; b <= kInt8Max; b++) {
      int c = folly::constexpr_clamp(a + b, int(kInt8Min), int(kInt8Max));
      int8_t a1 = a;
      int8_t b1 = b;
      int8_t c1 = folly::constexpr_add_overflow_clamped(a1, b1);
      ASSERT_LE(c1, kInt8Max);
      ASSERT_GE(c1, kInt8Min);
      ASSERT_EQ(c1, c);
    }
  }

  for (int a = 0; a <= kUInt8Max; a++) {
    for (int b = 0; b <= kUInt8Max; b++) {
      int c = folly::constexpr_clamp(a + b, 0, int(kUInt8Max));
      uint8_t a1 = a;
      uint8_t b1 = b;
      uint8_t c1 = folly::constexpr_add_overflow_clamped(a1, b1);
      ASSERT_LE(c1, kUInt8Max);
      ASSERT_GE(c1, 0);
      ASSERT_EQ(c1, c);
    }
  }

  constexpr auto v1 =
      folly::constexpr_add_overflow_clamped(int64_t(23), kInt64Max - 12);
  EXPECT_EQ(kInt64Max, v1);

  constexpr auto v2 =
      folly::constexpr_add_overflow_clamped(int64_t(23), int64_t(12));
  EXPECT_EQ(int64_t(35), v2);

  constexpr auto v3 =
      folly::constexpr_add_overflow_clamped(int64_t(-23), int64_t(12));
  EXPECT_EQ(int64_t(-11), v3);

  constexpr auto v4 =
      folly::constexpr_add_overflow_clamped(int64_t(-23), int64_t(-12));
  EXPECT_EQ(int64_t(-35), v4);

  constexpr auto v5 =
      folly::constexpr_add_overflow_clamped(uint64_t(23), kUInt64Max - 12);
  EXPECT_EQ(kUInt64Max, v5);
}

TEST_F(ConstexprMathTest, constexpr_sub_overflow_clamped) {
  for (int a = kInt8Min; a <= kInt8Max; a++) {
    for (int b = kInt8Min; b <= kInt8Max; b++) {
      int c = folly::constexpr_clamp(a - b, int(kInt8Min), int(kInt8Max));
      int8_t a1 = a;
      int8_t b1 = b;
      int8_t c1 = folly::constexpr_sub_overflow_clamped(a1, b1);
      ASSERT_LE(c1, kInt8Max);
      ASSERT_GE(c1, kInt8Min);
      ASSERT_EQ(c1, c);
    }
  }

  for (int a = 0; a <= kUInt8Max; a++) {
    for (int b = 0; b <= kUInt8Max; b++) {
      int c = folly::constexpr_clamp(a - b, 0, int(kUInt8Max));
      uint8_t a1 = a;
      uint8_t b1 = b;
      uint8_t c1 = folly::constexpr_sub_overflow_clamped(a1, b1);
      ASSERT_LE(c1, kUInt8Max);
      ASSERT_GE(c1, 0);
      ASSERT_EQ(c1, c);
    }
  }

  constexpr auto v1 =
      folly::constexpr_sub_overflow_clamped(int64_t(23), int64_t(12));
  EXPECT_EQ(int64_t(11), v1);

  constexpr auto v2 =
      folly::constexpr_sub_overflow_clamped(int64_t(-23), int64_t(-12));
  EXPECT_EQ(int64_t(-11), v2);

  constexpr auto v3 =
      folly::constexpr_sub_overflow_clamped(int64_t(23), int64_t(-12));
  EXPECT_EQ(int64_t(35), v3);

  constexpr auto v4 =
      folly::constexpr_sub_overflow_clamped(int64_t(23), kInt64Min);
  EXPECT_EQ(kInt64Max, v4);

  constexpr auto v5 =
      folly::constexpr_sub_overflow_clamped(int64_t(-23), kInt64Min);
  EXPECT_EQ(kInt64Max - 22, v5);

  constexpr auto v6 =
      folly::constexpr_sub_overflow_clamped(uint64_t(23), uint64_t(12));
  EXPECT_EQ(uint64_t(11), v6);

  constexpr auto v7 =
      folly::constexpr_sub_overflow_clamped(uint64_t(12), uint64_t(23));
  EXPECT_EQ(uint64_t(0), v7);
}

template <class F, class... Args>
void for_each_argument(F&& f, Args&&... args) {
  [](...) {}((f(std::forward<Args>(args)), 0)...);
}

// float -> integral clamp cast
template <typename Src, typename Dst>
static typename std::enable_if<std::is_floating_point<Src>::value, void>::type
run_constexpr_clamp_cast_test(Src, Dst) {
  constexpr auto kQuietNaN = std::numeric_limits<Src>::quiet_NaN();
  constexpr auto kSignalingNaN = std::numeric_limits<Src>::signaling_NaN();
  constexpr auto kPositiveInf = std::numeric_limits<Src>::infinity();
  constexpr auto kNegativeInf = -kPositiveInf;

  constexpr auto kDstMax = std::numeric_limits<Dst>::max();
  constexpr auto kDstMin = std::numeric_limits<Dst>::min();

  // Check f != f trick for identifying NaN.
  EXPECT_TRUE(kQuietNaN != kQuietNaN);
  EXPECT_TRUE(kSignalingNaN != kSignalingNaN);
  EXPECT_FALSE(kPositiveInf != kPositiveInf);
  EXPECT_FALSE(kNegativeInf != kNegativeInf);

  // NaN -> 0
  EXPECT_EQ(0, folly::constexpr_clamp_cast<Dst>(kQuietNaN));
  EXPECT_EQ(0, folly::constexpr_clamp_cast<Dst>(kSignalingNaN));

  // Inf -> Max/Min
  EXPECT_EQ(kDstMax, folly::constexpr_clamp_cast<Dst>(kPositiveInf));
  EXPECT_EQ(kDstMin, folly::constexpr_clamp_cast<Dst>(kNegativeInf));

  // barely out of range -> Max/Min
  EXPECT_EQ(kDstMax, folly::constexpr_clamp_cast<Dst>(Src(kDstMax) * 1.001));
  EXPECT_EQ(kDstMin, folly::constexpr_clamp_cast<Dst>(Src(kDstMin) * 1.001));

  // value in range -> same value
  EXPECT_EQ(Dst(0), folly::constexpr_clamp_cast<Dst>(Src(0)));
  EXPECT_EQ(Dst(123), folly::constexpr_clamp_cast<Dst>(Src(123)));
}

// integral -> integral clamp cast
template <typename Src, typename Dst>
static typename std::enable_if<std::is_integral<Src>::value, void>::type
run_constexpr_clamp_cast_test(Src, Dst) {
  constexpr auto kSrcMax = std::numeric_limits<Src>::max();
  constexpr auto kSrcMin = std::numeric_limits<Src>::min();

  constexpr auto kDstMax = std::numeric_limits<Dst>::max();
  constexpr auto kDstMin = std::numeric_limits<Dst>::min();

  // value in range -> same value
  EXPECT_EQ(Dst(0), folly::constexpr_clamp_cast<Dst>(Src(0)));
  EXPECT_EQ(Dst(123), folly::constexpr_clamp_cast<Dst>(Src(123)));

  // int -> uint
  if (std::is_signed<Src>::value && std::is_unsigned<Dst>::value) {
    EXPECT_EQ(Dst(0), folly::constexpr_clamp_cast<Dst>(Src(-123)));
  }

  if (sizeof(Src) > sizeof(Dst)) {
    // range clamping
    EXPECT_EQ(kDstMax, folly::constexpr_clamp_cast<Dst>(kSrcMax));

    // int -> int
    if (std::is_signed<Src>::value && std::is_signed<Dst>::value) {
      EXPECT_EQ(kDstMin, folly::constexpr_clamp_cast<Dst>(kSrcMin));
    }

  } else if (
      std::is_unsigned<Src>::value && std::is_signed<Dst>::value &&
      sizeof(Src) == sizeof(Dst)) {
    // uint -> int, same size
    EXPECT_EQ(kDstMax, folly::constexpr_clamp_cast<Dst>(kSrcMax));
  }
}

TEST_F(ConstexprMathTest, constexpr_clamp_cast) {
  for_each_argument(
      [](auto dst) {
        for_each_argument(
            [&](auto src) { run_constexpr_clamp_cast_test(src, dst); },
            // source types
            float(),
            double(),
            (long double)(0),
            int8_t(),
            uint8_t(),
            int16_t(),
            uint16_t(),
            int32_t(),
            uint32_t(),
            int64_t(),
            uint64_t());
      },
      // dst types
      int8_t(),
      uint8_t(),
      int16_t(),
      uint16_t(),
      int32_t(),
      uint32_t(),
      int64_t(),
      uint64_t());
}
