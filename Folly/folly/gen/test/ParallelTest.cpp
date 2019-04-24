/*
 * Copyright 2014-present Facebook, Inc.
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

#include <array>
#include <iostream>
#include <memory>
#include <vector>

#include <glog/logging.h>

#include <folly/gen/Base.h>
#include <folly/gen/Parallel.h>
#include <folly/portability/GTest.h>

using namespace folly;
using namespace folly::gen;
using std::vector;

const auto square = [](int i) { return i * i; };
const auto even = [](int i) { return 0 == i % 2; };
static auto sleepyWork = [](int i) {
  const auto sleepyTime = std::chrono::microseconds(100);
  std::this_thread::sleep_for(sleepyTime);
  return i;
};

static auto isPrime = [](int n) {
  if (n < 2) {
    return false;
  } else if (n > 2) {
    for (int d = 3; d * d <= n; d += 2) {
      if (0 == n % d) {
        return false;
      }
    }
  }
  return true;
};

struct {
  template <class T>
  std::unique_ptr<T> operator()(T t) const {
    return std::make_unique<T>(std::move(t));
  }
} makeUnique;

static auto primes = seq(1, 1 << 14) | filter(isPrime) | as<vector<size_t>>();

static auto primeFactors = [](int n) {
  return from(primes) | filter([&](int d) { return 0 == n % d; }) | count;
};

TEST(ParallelTest, Serial) {
  EXPECT_EQ(
      seq(1, 10) | map(square) | filter(even) | sum,
      seq(1, 10) | parallel(map(square) | filter(even)) | sum);
}

auto heavyWork = map(primeFactors);

TEST(ParallelTest, ComputeBound64) {
  int length = 1 << 10;
  EXPECT_EQ(
      seq<size_t>(1, length) | heavyWork | sum,
      seq<size_t>(1, length) | parallel(heavyWork) | sum);
}

TEST(ParallelTest, Take) {
  int length = 1 << 18;
  int limit = 1 << 14;
  EXPECT_EQ(
      seq(1, length) | take(limit) | count,
      seq(1, length) | parallel(heavyWork) | take(limit) | count);
}

TEST(ParallelTest, Unique) {
  auto uniqued = from(primes) | map(makeUnique) | as<vector>();
  EXPECT_EQ(
      primes.size(),
      from(primes) | parallel(map(makeUnique)) |
          parallel(dereference | map(makeUnique)) | dereference | count);
  EXPECT_EQ(
      2,
      from(primes) | parallel(map(makeUnique)) |
          parallel(dereference | map(makeUnique)) | dereference | take(2) |
          count);
}

TEST(ParallelTest, PSum) {
  EXPECT_EQ(
      from(primes) | map(sleepyWork) | sum,
      from(primes) | parallel(map(sleepyWork) | sub(sum)) | sum);
}

int main(int argc, char* argv[]) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  return RUN_ALL_TESTS();
}
