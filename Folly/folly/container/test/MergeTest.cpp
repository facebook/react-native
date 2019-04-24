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

#include <folly/container/Merge.h>

#include <map>
#include <vector>

#include <folly/portability/GTest.h>

TEST(MergeTest, NonOverlapping) {
  std::vector<int> a = {0, 2, 4, 6};
  std::vector<int> b = {1, 3, 5, 7};
  std::vector<int> c;

  folly::merge(a.begin(), a.end(), b.begin(), b.end(), std::back_inserter(c));
  EXPECT_EQ(8, c.size());
  for (size_t i = 0; i < 8; ++i) {
    EXPECT_EQ(i, c[i]);
  }
}

TEST(MergeTest, OverlappingInSingleInputRange) {
  std::vector<std::pair<int, int>> a = {{0, 0}, {0, 1}};
  std::vector<std::pair<int, int>> b = {{2, 2}, {3, 3}};
  std::map<int, int> c;

  folly::merge(
      a.begin(), a.end(), b.begin(), b.end(), std::inserter(c, c.begin()));
  EXPECT_EQ(3, c.size());

  // First value is inserted, second is not
  EXPECT_EQ(c[0], 0);

  EXPECT_EQ(c[2], 2);
  EXPECT_EQ(c[3], 3);
}

TEST(MergeTest, OverlappingInDifferentInputRange) {
  std::vector<std::pair<int, int>> a = {{0, 0}, {1, 1}};
  std::vector<std::pair<int, int>> b = {{0, 2}, {3, 3}};
  std::map<int, int> c;

  folly::merge(
      a.begin(), a.end(), b.begin(), b.end(), std::inserter(c, c.begin()));
  EXPECT_EQ(3, c.size());

  // Value from a is inserted, value from b is not.
  EXPECT_EQ(c[0], 0);

  EXPECT_EQ(c[1], 1);
  EXPECT_EQ(c[3], 3);
}
