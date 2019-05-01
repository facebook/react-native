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

#include <stdexcept>

#include <folly/portability/GTest.h>
#include <folly/test/JsonTestUtil.h>

using namespace folly;

TEST(CompareJson, Simple) {
  constexpr StringPiece json1 = R"({"a": 1, "b": 2})";
  constexpr StringPiece json2 = R"({"b": 2, "a": 1})";
  EXPECT_TRUE(compareJson(json1, json2));
  FOLLY_EXPECT_JSON_EQ(json1, json2);

  constexpr StringPiece json3 = R"({"b": 3, "a": 1})";
  EXPECT_FALSE(compareJson(json1, json3));
}

TEST(CompareJson, Malformed) {
  constexpr StringPiece json1 = R"({"a": 1, "b": 2})";
  constexpr StringPiece json2 = R"({"b": 2, "a": 1)";
  EXPECT_THROW(compareJson(json1, json2), std::runtime_error);
}

TEST(CompareJsonWithTolerance, Simple) {
  // Use the same tolerance for all tests.
  auto compare = [](StringPiece obj1, StringPiece obj2) {
    return compareJsonWithTolerance(obj1, obj2, 0.1);
  };

  EXPECT_TRUE(compare("1", "1.05"));
  EXPECT_FALSE(compare("1", "1.2"));

  EXPECT_TRUE(compare("true", "true"));
  EXPECT_FALSE(compare("true", "false"));
  EXPECT_FALSE(compare("true", "1"));

  EXPECT_TRUE(compare(R"([1, 2, 3])", R"([1.05, 2, 3.01])"));
  EXPECT_FALSE(compare(R"([1, 2, 3])", R"([1.2, 2, 3.01])"));
  EXPECT_FALSE(compare(R"([1, 2, 3])", R"([1, 2])"));

  EXPECT_TRUE(compare("1.0", "1.05"));
  EXPECT_FALSE(compare("1.0", "1.2"));

  EXPECT_TRUE(compare("1", "1"));
  EXPECT_FALSE(compare("1", "2"));

  EXPECT_TRUE(compare(R"({"a": 1, "b": 2})", R"({"b": 2.01, "a": 1.05})"));
  EXPECT_FALSE(compare(R"({"a": 1, "b": 2})", R"({"b": 2.01, "a": 1.2})"));
  EXPECT_FALSE(compare(R"({"a": 1, "b": 2})", R"({"b": 2})"));
  EXPECT_FALSE(compare(R"({"a": 1, "b": 2})", R"({"c": 2.01, "a": 1.05})"));

  EXPECT_TRUE(compare(R"("hello")", R"("hello")"));
  EXPECT_FALSE(compare(R"("hello")", R"("world")"));

  FOLLY_EXPECT_JSON_NEAR(
      R"({"a": 1, "b": 2})", R"({"b": 2.01, "a": 1.05})", 0.1);
}
