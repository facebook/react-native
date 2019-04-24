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

#include <folly/container/Access.h>

#include <array>
#include <initializer_list>
#include <vector>

#include <folly/portability/GTest.h>

class AccessTest : public testing::Test {};

TEST_F(AccessTest, size_vector) {
  EXPECT_EQ(3, folly::size(std::vector<int>{1, 2, 3}));
}

TEST_F(AccessTest, size_array) {
  constexpr auto const a = std::array<int, 3>{{1, 2, 3}};
  constexpr auto const size = folly::size(a);
  EXPECT_EQ(3, size);
}

TEST_F(AccessTest, size_carray) {
  constexpr int const a[3] = {1, 2, 3};
  constexpr auto const size = folly::size(a);
  EXPECT_EQ(3, size);
}

TEST_F(AccessTest, size_initializer_list) {
  EXPECT_EQ(3, folly::size({1, 2, 3}));
  EXPECT_EQ(3, folly::size(std::initializer_list<int>{1, 2, 3}));
}

TEST_F(AccessTest, empty_vector) {
  EXPECT_FALSE(folly::empty(std::vector<int>{1, 2, 3}));
  EXPECT_TRUE(folly::empty(std::vector<int>{}));
}

TEST_F(AccessTest, empty_array) {
  {
    constexpr auto const a = std::array<int, 3>{{1, 2, 3}};
    constexpr auto const empty = folly::empty(a);
    EXPECT_FALSE(empty);
  }
  {
    constexpr auto const a = std::array<int, 0>{{}};
    constexpr auto const empty = folly::empty(a);
    EXPECT_TRUE(empty);
  }
}

TEST_F(AccessTest, empty_carray) {
  constexpr int const a[3] = {1, 2, 3};
  constexpr auto const empty = folly::empty(a);
  EXPECT_FALSE(empty);
  //  zero-length arrays are not allowed in the language
}

TEST_F(AccessTest, empty_initializer_list) {
  EXPECT_FALSE(folly::empty({1, 2, 3}));
  EXPECT_FALSE(folly::empty(std::initializer_list<int>{1, 2, 3}));
  EXPECT_TRUE(folly::empty(std::initializer_list<int>{}));
}

TEST_F(AccessTest, data_vector) {
  EXPECT_EQ(1, *folly::data(std::vector<int>{1, 2, 3}));
  auto v = std::vector<int>{1, 2, 3};
  *folly::data(v) = 4;
  EXPECT_EQ(4, v[0]);
}

TEST_F(AccessTest, data_array) {
  constexpr auto const a = std::array<int, 3>{{1, 2, 3}};
  auto const data = folly::data(a); // not constexpr until C++17
  EXPECT_EQ(1, *data);
}

TEST_F(AccessTest, data_carray) {
  constexpr int const a[3] = {1, 2, 3};
  auto const data = folly::data(a); // not constexpr until C++17
  EXPECT_EQ(1, *data);
}

TEST_F(AccessTest, data_initializer_list) {
  EXPECT_EQ(1, *folly::data({1, 2, 3}));
  EXPECT_EQ(1, *folly::data(std::initializer_list<int>{1, 2, 3}));
}
