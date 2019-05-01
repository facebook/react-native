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

#include <folly/stats/detail/DigestBuilder-defs.h>

#include <chrono>
#include <random>
#include <thread>

#include <folly/Range.h>
#include <folly/portability/GTest.h>

using namespace folly;
using namespace folly::detail;

template <size_t MergeSize>
class SimpleDigest {
 public:
  explicit SimpleDigest(size_t sz) : sz_(sz) {}

  SimpleDigest merge(Range<const double*> r) const {
    EXPECT_EQ(MergeSize, r.size());
    for (size_t i = 0; i < MergeSize; ++i) {
      EXPECT_GE(MergeSize, r[i]);
    }
    return *this;
  }

  static SimpleDigest merge(Range<const SimpleDigest*> r) {
    EXPECT_EQ(1, r.size());
    return *r.begin();
  }

  int64_t getSize() const {
    return sz_;
  }

 private:
  int64_t sz_;
};

TEST(DigestBuilder, SingleThreadUnfilledBuffer) {
  DigestBuilder<SimpleDigest<999>> builder(1000, 100);
  for (int i = 0; i < 999; ++i) {
    builder.append(i);
  }
  EXPECT_EQ(100, builder.build().getSize());
}

TEST(DigestBuilder, SingleThreadFilledBuffer) {
  DigestBuilder<SimpleDigest<1000>> builder(1000, 100);
  for (int i = 0; i < 1000; ++i) {
    builder.append(i);
  }
  EXPECT_EQ(100, builder.build().getSize());
}

TEST(DigestBuilder, MultipleThreads) {
  DigestBuilder<SimpleDigest<1000>> builder(1000, 100);
  std::vector<std::thread> threads;
  for (int i = 0; i < 10; ++i) {
    threads.push_back(std::thread([i, &builder]() {
      for (int j = 0; j < 100; ++j) {
        builder.append(i * 100 + j);
      }
    }));
  }
  for (auto& thread : threads) {
    thread.join();
  }

  EXPECT_EQ(100, builder.build().getSize());
}
