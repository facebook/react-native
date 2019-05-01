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

#include <folly/stats/detail/SlidingWindow-defs.h>

#include <folly/portability/GTest.h>

using namespace folly;
using namespace folly::detail;

class SlidingWindowTest : public ::testing::Test {
 protected:
  std::unique_ptr<SlidingWindow<size_t>> slidingWindow;
  size_t curWindow = 0;

  void SetUp() override {
    slidingWindow = std::make_unique<SlidingWindow<size_t>>(
        [&]() { return curWindow++; }, 60);
  }
};

TEST_F(SlidingWindowTest, Constructor) {
  auto buckets = slidingWindow->get();
  EXPECT_EQ(60, buckets.size());

  for (size_t i = 0; i < 60; ++i) {
    EXPECT_EQ(60 - i - 1, buckets[i]);
  }
}

TEST_F(SlidingWindowTest, SlideZero) {
  slidingWindow->slide(0);
  auto buckets = slidingWindow->get();
  EXPECT_EQ(60, buckets.size());

  for (size_t i = 0; i < 60; ++i) {
    EXPECT_EQ(60 - i - 1, buckets[i]);
  }
}

TEST_F(SlidingWindowTest, SlideLessThanFullAmount) {
  slidingWindow->slide(5);
  auto buckets = slidingWindow->get();
  EXPECT_EQ(60, buckets.size());

  for (size_t i = 0; i < 60; ++i) {
    EXPECT_EQ(65 - i - 1, buckets[i]);
  }
}

TEST_F(SlidingWindowTest, SlideMoreThanFullAmount) {
  slidingWindow->slide(60);
  auto buckets = slidingWindow->get();
  EXPECT_EQ(60, buckets.size());

  for (size_t i = 0; i < 60; ++i) {
    EXPECT_EQ(120 - i - 1, buckets[i]);
  }
}
