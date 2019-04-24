/*
 * Copyright 2012-present Facebook, Inc.
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

#include <folly/Random.h>

#include <algorithm>
#include <random>
#include <thread>
#include <unordered_set>
#include <vector>

#include <glog/logging.h>

#include <folly/portability/GTest.h>

using namespace folly;

TEST(Random, StateSize) {
  using namespace folly::detail;

  // uint_fast32_t is uint64_t on x86_64, w00t
  EXPECT_EQ(
      sizeof(uint_fast32_t) / 4 + 3, StateSizeT<std::minstd_rand0>::value);
  EXPECT_EQ(624, StateSizeT<std::mt19937>::value);
#if FOLLY_HAVE_EXTRANDOM_SFMT19937
  EXPECT_EQ(624, StateSizeT<__gnu_cxx::sfmt19937>::value);
#endif
  EXPECT_EQ(24, StateSizeT<std::ranlux24_base>::value);
}

TEST(Random, Simple) {
  uint32_t prev = 0, seed = 0;
  for (int i = 0; i < 1024; ++i) {
    EXPECT_NE(seed = randomNumberSeed(), prev);
    prev = seed;
  }
}

TEST(Random, FixedSeed) {
  // clang-format off
  struct ConstantRNG {
    typedef uint32_t result_type;
    result_type operator()() {
      return 4; // chosen by fair dice roll.
                // guaranteed to be random.
    }
    static constexpr result_type min() {
      return std::numeric_limits<result_type>::min();
    }
    static constexpr result_type max() {
      return std::numeric_limits<result_type>::max();
    }
  };
  // clang-format on

  ConstantRNG gen;

  // Pick a constant random number...
  auto value = Random::rand32(10, gen);

  // Loop to make sure it really is constant.
  for (int i = 0; i < 1024; ++i) {
    auto result = Random::rand32(10, gen);
    EXPECT_EQ(value, result);
  }
}

TEST(Random, MultiThreaded) {
  const int n = 100;
  std::vector<uint32_t> seeds(n);
  std::vector<std::thread> threads;
  for (int i = 0; i < n; ++i) {
    threads.push_back(
        std::thread([i, &seeds] { seeds[i] = randomNumberSeed(); }));
  }
  for (auto& t : threads) {
    t.join();
  }
  std::sort(seeds.begin(), seeds.end());
  for (int i = 0; i < n - 1; ++i) {
    EXPECT_LT(seeds[i], seeds[i + 1]);
  }
}

TEST(Random, sanity) {
  // edge cases
  EXPECT_EQ(folly::Random::rand32(0), 0);
  EXPECT_EQ(folly::Random::rand32(12, 12), 0);
  EXPECT_EQ(folly::Random::rand64(0), 0);
  EXPECT_EQ(folly::Random::rand64(12, 12), 0);

  // 32-bit repeatability, uniqueness
  constexpr int kTestSize = 1000;
  {
    std::vector<uint32_t> vals;
    folly::Random::DefaultGenerator rng;
    rng.seed(0xdeadbeef);
    for (int i = 0; i < kTestSize; ++i) {
      vals.push_back(folly::Random::rand32(rng));
    }
    rng.seed(0xdeadbeef);
    for (int i = 0; i < kTestSize; ++i) {
      EXPECT_EQ(vals[i], folly::Random::rand32(rng));
    }
    EXPECT_EQ(
        vals.size(),
        std::unordered_set<uint32_t>(vals.begin(), vals.end()).size());
  }

  // 64-bit repeatability, uniqueness
  {
    std::vector<uint64_t> vals;
    folly::Random::DefaultGenerator rng;
    rng.seed(0xdeadbeef);
    for (int i = 0; i < kTestSize; ++i) {
      vals.push_back(folly::Random::rand64(rng));
    }
    rng.seed(0xdeadbeef);
    for (int i = 0; i < kTestSize; ++i) {
      EXPECT_EQ(vals[i], folly::Random::rand64(rng));
    }
    EXPECT_EQ(
        vals.size(),
        std::unordered_set<uint64_t>(vals.begin(), vals.end()).size());
  }
}

#ifndef _WIN32
TEST(Random, SecureFork) {
  // Random buffer size is 128, must be less than that.
  int retries = 100;
  while (true) {
    unsigned char buffer = 0;
    // Init random buffer
    folly::Random::secureRandom(&buffer, 1);

    auto pid = fork();
    EXPECT_NE(pid, -1);
    if (pid) {
      // parent
      int status = 0;
      folly::Random::secureRandom(&buffer, 1);
      auto pid2 = wait(&status);
      EXPECT_EQ(pid, pid2);
      // Since this *is* random data, we could randomly end up with
      // the same byte.  Try again a few times if so before assuming
      // real failure.
      if (WEXITSTATUS(status) == buffer && retries-- > 0) {
        continue;
      }
      EXPECT_NE(WEXITSTATUS(status), buffer);
      return;
    } else {
      // child
      folly::Random::secureRandom(&buffer, 1);
      exit(buffer); // Do not print gtest results
    }
  }
}
#endif
