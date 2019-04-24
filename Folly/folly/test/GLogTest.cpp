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

#include <folly/GLog.h>

#include <folly/portability/GTest.h>

#include <vector>

TEST(LogEveryMs, basic) {
  std::vector<std::chrono::steady_clock::time_point> hist;

  while (hist.size() < 10) {
    FB_LOG_EVERY_MS(INFO, 10)
        << "test msg "
        << (hist.push_back(std::chrono::steady_clock::now()), hist.size());
  }

  bool atLeastOneIsGood = false;
  for (size_t i = 0; i < hist.size() - 1; ++i) {
    auto delta = hist[i + 1] - hist[i];
    if (delta > std::chrono::milliseconds(5) &&
        delta < std::chrono::milliseconds(15)) {
      atLeastOneIsGood = true;
    }
  }
  EXPECT_TRUE(atLeastOneIsGood);
}

TEST(LogEveryMs, zero) {
  int count = 0;

  for (int i = 0; i < 10; ++i) {
    FB_LOG_EVERY_MS(INFO, 0) << "test msg " << ++count;
  }

  EXPECT_EQ(10, count);
}
