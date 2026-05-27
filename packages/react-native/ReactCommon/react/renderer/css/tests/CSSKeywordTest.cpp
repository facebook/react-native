/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSKeyword.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSKeyword, keyword_values) {
  auto emptyValue = parseCSSProperty<CSSKeyword>("");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(emptyValue));

  auto inheritValue = parseCSSProperty<>("inherit");
  EXPECT_TRUE(std::holds_alternative<CSSWideKeyword>(inheritValue));
  EXPECT_EQ(std::get<CSSWideKeyword>(inheritValue), CSSWideKeyword::Inherit);

  auto autoValue = parseCSSProperty<CSSKeyword>("auto");
  EXPECT_TRUE(std::holds_alternative<CSSKeyword>(autoValue));
  EXPECT_EQ(std::get<CSSKeyword>(autoValue), CSSKeyword::Auto);

  auto autoCapsValue = parseCSSProperty<CSSKeyword>("AuTO");
  EXPECT_TRUE(std::holds_alternative<CSSKeyword>(autoCapsValue));
  EXPECT_EQ(std::get<CSSKeyword>(autoCapsValue), CSSKeyword::Auto);

  auto autoDisallowedValue = parseCSSProperty<>("auto");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(autoDisallowedValue));

  auto whitespaceValue = parseCSSProperty<CSSKeyword>(" flex-start   ");
  EXPECT_TRUE(std::holds_alternative<CSSKeyword>(whitespaceValue));
  EXPECT_EQ(std::get<CSSKeyword>(whitespaceValue), CSSKeyword::FlexStart);

  auto badIdentValue = parseCSSProperty<CSSKeyword>("bad");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(badIdentValue));

  auto pxValue = parseCSSProperty<>("20px");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(pxValue));

  auto multiValue = parseCSSProperty<>("auto flex-start");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(multiValue));
}

TEST(CSSKeyword, parse_constexpr) {
  [[maybe_unused]] constexpr auto rowValue =
      parseCSSProperty<CSSKeyword>("row");
}

} // namespace facebook::react
