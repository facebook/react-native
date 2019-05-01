/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/Math.h>

#include <algorithm>
#include <type_traits>
#include <utility>
#include <vector>

#include <glog/logging.h>

#include <folly/Portability.h>
#include <folly/portability/GTest.h>

using namespace folly;
using namespace folly::detail;

namespace {

// Workaround for https://llvm.org/bugs/show_bug.cgi?id=16404,
// issues with __int128 multiplication and UBSAN
template <typename T>
T mul(T lhs, T rhs) {
  if (rhs < 0) {
    rhs = -rhs;
    lhs = -lhs;
  }
  T accum = 0;
  while (rhs != 0) {
    if ((rhs & 1) != 0) {
      accum += lhs;
    }
    lhs += lhs;
    rhs >>= 1;
  }
  return accum;
}

template <typename T, typename B>
T referenceDivFloor(T numer, T denom) {
  // rv = largest integral value <= numer / denom
  B n = numer;
  B d = denom;
  if (d < 0) {
    d = -d;
    n = -n;
  }
  B r = n / d;
  while (mul(r, d) > n) {
    --r;
  }
  while (mul(r + 1, d) <= n) {
    ++r;
  }
  T rv = static_cast<T>(r);
  assert(static_cast<B>(rv) == r);
  return rv;
}

template <typename T, typename B>
T referenceDivCeil(T numer, T denom) {
  // rv = smallest integral value >= numer / denom
  B n = numer;
  B d = denom;
  if (d < 0) {
    d = -d;
    n = -n;
  }
  B r = n / d;
  while (mul(r, d) < n) {
    ++r;
  }
  while (mul(r - 1, d) >= n) {
    --r;
  }
  T rv = static_cast<T>(r);
  assert(static_cast<B>(rv) == r);
  return rv;
}

template <typename T, typename B>
T referenceDivRoundAway(T numer, T denom) {
  if ((numer < 0) != (denom < 0)) {
    return referenceDivFloor<T, B>(numer, denom);
  } else {
    return referenceDivCeil<T, B>(numer, denom);
  }
}

template <typename T>
std::vector<T> cornerValues() {
  std::vector<T> rv;
  for (T i = 1; i < 24; ++i) {
    rv.push_back(i);
    rv.push_back(T(std::numeric_limits<T>::max() / i));
    rv.push_back(T(std::numeric_limits<T>::max() - i));
    rv.push_back(T(std::numeric_limits<T>::max() / T(2) - i));
    if (std::is_signed<T>::value) {
      rv.push_back(-i);
      rv.push_back(T(std::numeric_limits<T>::min() / i));
      rv.push_back(T(std::numeric_limits<T>::min() + i));
      rv.push_back(T(std::numeric_limits<T>::min() / T(2) + i));
    }
  }
  return rv;
}

template <typename A, typename B, typename C>
void runDivTests() {
  using T = decltype(static_cast<A>(1) / static_cast<B>(1));
  auto numers = cornerValues<A>();
  numers.push_back(0);
  auto denoms = cornerValues<B>();
  for (A n : numers) {
    for (B d : denoms) {
      if (std::is_signed<T>::value && n == std::numeric_limits<T>::min() &&
          d == static_cast<T>(-1)) {
        // n / d overflows in two's complement
        continue;
      }
      EXPECT_EQ(divCeil(n, d), (referenceDivCeil<T, C>(n, d))) << n << "/" << d;
      EXPECT_EQ(divFloor(n, d), (referenceDivFloor<T, C>(n, d)))
          << n << "/" << d;
      EXPECT_EQ(divTrunc(n, d), n / d) << n << "/" << d;
      EXPECT_EQ(divRoundAway(n, d), (referenceDivRoundAway<T, C>(n, d)))
          << n << "/" << d;
      T nn = n;
      T dd = d;
      EXPECT_EQ(divCeilBranchless(nn, dd), divCeilBranchful(nn, dd));
      EXPECT_EQ(divFloorBranchless(nn, dd), divFloorBranchful(nn, dd));
      EXPECT_EQ(divRoundAwayBranchless(nn, dd), divRoundAwayBranchful(nn, dd));
    }
  }
}
} // namespace

TEST(Bits, divTestInt8) {
  runDivTests<int8_t, int8_t, int64_t>();
  runDivTests<int8_t, uint8_t, int64_t>();
  runDivTests<int8_t, int16_t, int64_t>();
  runDivTests<int8_t, uint16_t, int64_t>();
  runDivTests<int8_t, int32_t, int64_t>();
  runDivTests<int8_t, uint32_t, int64_t>();
#if FOLLY_HAVE_INT128_T
  runDivTests<int8_t, int64_t, __int128>();
  runDivTests<int8_t, uint64_t, __int128>();
#endif
}
TEST(Bits, divTestInt16) {
  runDivTests<int16_t, int8_t, int64_t>();
  runDivTests<int16_t, uint8_t, int64_t>();
  runDivTests<int16_t, int16_t, int64_t>();
  runDivTests<int16_t, uint16_t, int64_t>();
  runDivTests<int16_t, int32_t, int64_t>();
  runDivTests<int16_t, uint32_t, int64_t>();
#if FOLLY_HAVE_INT128_T
  runDivTests<int16_t, int64_t, __int128>();
  runDivTests<int16_t, uint64_t, __int128>();
#endif
}
TEST(Bits, divTestInt32) {
  runDivTests<int32_t, int8_t, int64_t>();
  runDivTests<int32_t, uint8_t, int64_t>();
  runDivTests<int32_t, int16_t, int64_t>();
  runDivTests<int32_t, uint16_t, int64_t>();
  runDivTests<int32_t, int32_t, int64_t>();
  runDivTests<int32_t, uint32_t, int64_t>();
#if FOLLY_HAVE_INT128_T
  runDivTests<int32_t, int64_t, __int128>();
  runDivTests<int32_t, uint64_t, __int128>();
#endif
}
#if FOLLY_HAVE_INT128_T
TEST(Bits, divTestInt64) {
  runDivTests<int64_t, int8_t, __int128>();
  runDivTests<int64_t, uint8_t, __int128>();
  runDivTests<int64_t, int16_t, __int128>();
  runDivTests<int64_t, uint16_t, __int128>();
  runDivTests<int64_t, int32_t, __int128>();
  runDivTests<int64_t, uint32_t, __int128>();
  runDivTests<int64_t, int64_t, __int128>();
  runDivTests<int64_t, uint64_t, __int128>();
}
#endif
TEST(Bits, divTestUint8) {
  runDivTests<uint8_t, int8_t, int64_t>();
  runDivTests<uint8_t, uint8_t, int64_t>();
  runDivTests<uint8_t, int16_t, int64_t>();
  runDivTests<uint8_t, uint16_t, int64_t>();
  runDivTests<uint8_t, int32_t, int64_t>();
  runDivTests<uint8_t, uint32_t, int64_t>();
#if FOLLY_HAVE_INT128_T
  runDivTests<uint8_t, int64_t, __int128>();
  runDivTests<uint8_t, uint64_t, __int128>();
#endif
}
TEST(Bits, divTestUint16) {
  runDivTests<uint16_t, int8_t, int64_t>();
  runDivTests<uint16_t, uint8_t, int64_t>();
  runDivTests<uint16_t, int16_t, int64_t>();
  runDivTests<uint16_t, uint16_t, int64_t>();
  runDivTests<uint16_t, int32_t, int64_t>();
  runDivTests<uint16_t, uint32_t, int64_t>();
#if FOLLY_HAVE_INT128_T
  runDivTests<uint16_t, int64_t, __int128>();
  runDivTests<uint16_t, uint64_t, __int128>();
#endif
}
TEST(Bits, divTestUint32) {
  runDivTests<uint32_t, int8_t, int64_t>();
  runDivTests<uint32_t, uint8_t, int64_t>();
  runDivTests<uint32_t, int16_t, int64_t>();
  runDivTests<uint32_t, uint16_t, int64_t>();
  runDivTests<uint32_t, int32_t, int64_t>();
  runDivTests<uint32_t, uint32_t, int64_t>();
#if FOLLY_HAVE_INT128_T
  runDivTests<uint32_t, int64_t, __int128>();
  runDivTests<uint32_t, uint64_t, __int128>();
#endif
}
#if FOLLY_HAVE_INT128_T
TEST(Bits, divTestUint64) {
  runDivTests<uint64_t, int8_t, __int128>();
  runDivTests<uint64_t, uint8_t, __int128>();
  runDivTests<uint64_t, int16_t, __int128>();
  runDivTests<uint64_t, uint16_t, __int128>();
  runDivTests<uint64_t, int32_t, __int128>();
  runDivTests<uint64_t, uint32_t, __int128>();
  runDivTests<uint64_t, int64_t, __int128>();
  runDivTests<uint64_t, uint64_t, __int128>();
}
#endif
