/*
 * Copyright 2011-present Facebook, Inc.
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

#include <folly/json_pointer.h>
#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>

using folly::json_pointer;
using ::testing::ElementsAreArray;

class JsonPointerTest : public ::testing::Test {};

TEST_F(JsonPointerTest, ValidPointers) {
  EXPECT_THAT(
      json_pointer::parse("").tokens(),
      ElementsAreArray(std::vector<std::string>{}));
  EXPECT_THAT(json_pointer::parse("/").tokens(), ElementsAreArray({""}));
  EXPECT_THAT(
      json_pointer::parse("/1/2/3").tokens(),
      ElementsAreArray({"1", "2", "3"}));
  EXPECT_THAT(
      json_pointer::parse("/~0~1/~0/10").tokens(),
      ElementsAreArray({"~/", "~", "10"}));
}

TEST_F(JsonPointerTest, InvalidPointers) {
  EXPECT_EQ(
      json_pointer::parse_error::invalid_first_character,
      json_pointer::try_parse("a").error());
  EXPECT_EQ(
      json_pointer::parse_error::invalid_escape_sequence,
      json_pointer::try_parse("/~").error());
  EXPECT_EQ(
      json_pointer::parse_error::invalid_escape_sequence,
      json_pointer::try_parse("/~x").error());
}

TEST_F(JsonPointerTest, IsPrefixTo) {
  EXPECT_TRUE(
      json_pointer::parse("/a/b").is_prefix_of(json_pointer::parse("/a/b/c")));
  EXPECT_FALSE(
      json_pointer::parse("/a/b").is_prefix_of(json_pointer::parse("/a/d/e")));
  EXPECT_FALSE(
      json_pointer::parse("/a/b/c").is_prefix_of(json_pointer::parse("/a/b")));
}
