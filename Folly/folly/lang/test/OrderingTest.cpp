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

#include <folly/lang/Ordering.h>

#include <folly/portability/GTest.h>

using namespace folly;

template <typename T>
struct OddCompare {
  constexpr ordering operator()(T const& a, T const& b) const {
    return b < a ? ordering::lt : a < b ? ordering::gt : ordering::eq;
  }
};

class OrderingTest : public testing::Test {};

TEST_F(OrderingTest, ordering) {
  EXPECT_EQ(-1, int(ordering::lt));
  EXPECT_EQ(0, int(ordering::eq));
  EXPECT_EQ(+1, int(ordering::gt));
}

TEST_F(OrderingTest, to_ordering) {
  EXPECT_EQ(ordering::lt, to_ordering(int(ordering::lt)));
  EXPECT_EQ(ordering::eq, to_ordering(int(ordering::eq)));
  EXPECT_EQ(ordering::gt, to_ordering(int(ordering::gt)));

  EXPECT_EQ(ordering::lt, to_ordering(-22));
  EXPECT_EQ(ordering::eq, to_ordering(0));
  EXPECT_EQ(ordering::gt, to_ordering(+44));
}

TEST_F(OrderingTest, compare_equal_to) {
  compare_equal_to<OddCompare<int>> op;
  EXPECT_FALSE(op(3, 4));
  EXPECT_TRUE(op(3, 3));
  EXPECT_FALSE(op(4, 3));
}

TEST_F(OrderingTest, compare_not_equal_to) {
  compare_not_equal_to<OddCompare<int>> op;
  EXPECT_TRUE(op(3, 4));
  EXPECT_FALSE(op(3, 3));
  EXPECT_TRUE(op(4, 3));
}

TEST_F(OrderingTest, compare_less) {
  compare_less<OddCompare<int>> op;
  EXPECT_FALSE(op(3, 4));
  EXPECT_FALSE(op(3, 3));
  EXPECT_TRUE(op(4, 3));
}

TEST_F(OrderingTest, compare_less_equal) {
  compare_less_equal<OddCompare<int>> op;
  EXPECT_FALSE(op(3, 4));
  EXPECT_TRUE(op(3, 3));
  EXPECT_TRUE(op(4, 3));
}

TEST_F(OrderingTest, compare_greater) {
  compare_greater<OddCompare<int>> op;
  EXPECT_TRUE(op(3, 4));
  EXPECT_FALSE(op(3, 3));
  EXPECT_FALSE(op(4, 3));
}

TEST_F(OrderingTest, compare_greater_equal) {
  compare_greater_equal<OddCompare<int>> op;
  EXPECT_TRUE(op(3, 4));
  EXPECT_TRUE(op(3, 3));
  EXPECT_FALSE(op(4, 3));
}
