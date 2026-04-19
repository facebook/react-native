/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include "internal/LongestIncreasingSubsequence.h"

namespace facebook::react {

TEST(LongestIncreasingSubsequenceTest, emptyInput) {
  auto result = longestIncreasingSubsequence({}, {});
  EXPECT_TRUE(result.empty());
}

TEST(LongestIncreasingSubsequenceTest, singleElement) {
  auto result = longestIncreasingSubsequence({5}, {true});
  ASSERT_EQ(result.size(), 1u);
  EXPECT_TRUE(result[0]);
}

TEST(LongestIncreasingSubsequenceTest, alreadySorted) {
  // [0, 1, 2, 3, 4] — entire sequence is the LIS.
  std::vector<size_t> values = {0, 1, 2, 3, 4};
  std::vector<bool> include = {true, true, true, true, true};
  auto result = longestIncreasingSubsequence(values, include);

  ASSERT_EQ(result.size(), 5u);
  for (size_t i = 0; i < 5; i++) {
    EXPECT_TRUE(result[i]) << "index " << i << " should be in LIS";
  }
}

TEST(LongestIncreasingSubsequenceTest, reverseSorted) {
  // [4, 3, 2, 1, 0] — LIS length is 1.
  std::vector<size_t> values = {4, 3, 2, 1, 0};
  std::vector<bool> include = {true, true, true, true, true};
  auto result = longestIncreasingSubsequence(values, include);

  ASSERT_EQ(result.size(), 5u);
  int count = 0;
  for (size_t i = 0; i < 5; i++) {
    if (result[i]) {
      count++;
    }
  }
  EXPECT_EQ(count, 1);
}

TEST(LongestIncreasingSubsequenceTest, moveLastToFront) {
  // Old: [A, B, C, D, E] mapped to new positions [1, 2, 3, 4, 0]
  // LIS should be [1, 2, 3, 4] (indices 0-3), leaving index 4 out.
  std::vector<size_t> values = {1, 2, 3, 4, 0};
  std::vector<bool> include = {true, true, true, true, true};
  auto result = longestIncreasingSubsequence(values, include);

  ASSERT_EQ(result.size(), 5u);
  EXPECT_TRUE(result[0]); // value 1
  EXPECT_TRUE(result[1]); // value 2
  EXPECT_TRUE(result[2]); // value 3
  EXPECT_TRUE(result[3]); // value 4
  EXPECT_FALSE(result[4]); // value 0
}

TEST(LongestIncreasingSubsequenceTest, moveFirstToLast) {
  // Old: [A, B, C, D, E] mapped to new positions [4, 0, 1, 2, 3]
  // LIS should be [0, 1, 2, 3] (indices 1-4), leaving index 0 out.
  std::vector<size_t> values = {4, 0, 1, 2, 3};
  std::vector<bool> include = {true, true, true, true, true};
  auto result = longestIncreasingSubsequence(values, include);

  ASSERT_EQ(result.size(), 5u);
  EXPECT_FALSE(result[0]); // value 4
  EXPECT_TRUE(result[1]); // value 0
  EXPECT_TRUE(result[2]); // value 1
  EXPECT_TRUE(result[3]); // value 2
  EXPECT_TRUE(result[4]); // value 3
}

TEST(LongestIncreasingSubsequenceTest, withExcludedElements) {
  // values = [1, _, 3, _, 0] where _ are excluded (deleted from new list)
  std::vector<size_t> values = {1, 999, 3, 999, 0};
  std::vector<bool> include = {true, false, true, false, true};
  auto result = longestIncreasingSubsequence(values, include);

  ASSERT_EQ(result.size(), 5u);
  EXPECT_FALSE(result[1]); // excluded
  EXPECT_FALSE(result[3]); // excluded

  // Among included: [1, 3, 0]. LIS is [1, 3] (length 2).
  EXPECT_TRUE(result[0]); // value 1
  EXPECT_TRUE(result[2]); // value 3
  EXPECT_FALSE(result[4]); // value 0
}

TEST(LongestIncreasingSubsequenceTest, allExcluded) {
  std::vector<size_t> values = {3, 1, 2};
  std::vector<bool> include = {false, false, false};
  auto result = longestIncreasingSubsequence(values, include);

  ASSERT_EQ(result.size(), 3u);
  EXPECT_FALSE(result[0]);
  EXPECT_FALSE(result[1]);
  EXPECT_FALSE(result[2]);
}

TEST(LongestIncreasingSubsequenceTest, interleaved) {
  // [3, 1, 4, 1, 5, 9, 2, 6]
  // One valid LIS: [1, 4, 5, 9] or [1, 2, 6] etc. Length should be 4.
  std::vector<size_t> values = {3, 1, 4, 1, 5, 9, 2, 6};
  std::vector<bool> include(8, true);
  auto result = longestIncreasingSubsequence(values, include);

  ASSERT_EQ(result.size(), 8u);
  int count = 0;
  size_t prev = 0;
  bool first = true;
  for (size_t i = 0; i < 8; i++) {
    if (result[i]) {
      count++;
      if (!first) {
        EXPECT_GT(values[i], prev) << "LIS must be strictly increasing";
      }
      prev = values[i];
      first = false;
    }
  }
  EXPECT_EQ(count, 4);
}

TEST(LongestIncreasingSubsequenceTest, swapTwoElements) {
  // Old: [A, B, C, D] → New: [A, C, B, D] → positions [0, 2, 1, 3]
  // LIS: [0, 1, 3] or [0, 2, 3] — length 3, one element out.
  std::vector<size_t> values = {0, 2, 1, 3};
  std::vector<bool> include = {true, true, true, true};
  auto result = longestIncreasingSubsequence(values, include);

  ASSERT_EQ(result.size(), 4u);
  int count = 0;
  for (size_t i = 0; i < 4; i++) {
    if (result[i]) {
      count++;
    }
  }
  EXPECT_EQ(count, 3);
  // First and last should always be in LIS.
  EXPECT_TRUE(result[0]); // value 0
  EXPECT_TRUE(result[3]); // value 3
}

} // namespace facebook::react
