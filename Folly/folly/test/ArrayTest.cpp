/*
 * Copyright 2017 Facebook, Inc.
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
#include <folly/Array.h>
#include <folly/portability/GTest.h>
#include <string>

using namespace std;
using folly::make_array;

TEST(make_array, base_case) {
  auto arr = make_array<int>();
  static_assert(
      is_same<typename decltype(arr)::value_type, int>::value,
      "Wrong array type");
  EXPECT_EQ(arr.size(), 0);
}

TEST(make_array, deduce_size_primitive) {
  auto arr = make_array<int>(1, 2, 3, 4, 5);
  static_assert(
      is_same<typename decltype(arr)::value_type, int>::value,
      "Wrong array type");
  EXPECT_EQ(arr.size(), 5);
}

TEST(make_array, deduce_size_class) {
  auto arr = make_array<string>(string{"foo"}, string{"bar"});
  static_assert(
      is_same<typename decltype(arr)::value_type, std::string>::value,
      "Wrong array type");
  EXPECT_EQ(arr.size(), 2);
  EXPECT_EQ(arr[1], "bar");
}

TEST(make_array, deduce_everything) {
  auto arr = make_array(string{"foo"}, string{"bar"});
  static_assert(
      is_same<typename decltype(arr)::value_type, std::string>::value,
      "Wrong array type");
  EXPECT_EQ(arr.size(), 2);
  EXPECT_EQ(arr[1], "bar");
}

TEST(make_array, fixed_common_type) {
  auto arr = make_array<double>(1.0, 2.5f, 3, 4, 5);
  static_assert(
      is_same<typename decltype(arr)::value_type, double>::value,
      "Wrong array type");
  EXPECT_EQ(arr.size(), 5);
}

TEST(make_array, deduced_common_type) {
  auto arr = make_array(1.0, 2.5f, 3, 4, 5);
  static_assert(
      is_same<typename decltype(arr)::value_type, double>::value,
      "Wrong array type");
  EXPECT_EQ(arr.size(), 5);
}
