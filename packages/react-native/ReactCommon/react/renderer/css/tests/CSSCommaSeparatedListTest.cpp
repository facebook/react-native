/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSCommaSeparatedList.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSCommaSeparatedList, empty_values) {
  auto emptyValue = parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>("");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(emptyValue));

  auto whitespaceValue =
      parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>(" ");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(whitespaceValue));

  auto commaValue = parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>(",");
}

TEST(CSSCommaSeparatedList, single_value) {
  auto simpleValue = parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>("20");
  EXPECT_TRUE(
      std::holds_alternative<CSSCommaSeparatedList<CSSNumber>>(simpleValue));
  EXPECT_EQ(std::get<CSSCommaSeparatedList<CSSNumber>>(simpleValue).size(), 1);
  EXPECT_EQ(
      std::get<CSSCommaSeparatedList<CSSNumber>>(simpleValue)[0].value, 20);

  auto whitespaceValue =
      parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>(" 20 ");
  EXPECT_TRUE(std::holds_alternative<CSSCommaSeparatedList<CSSNumber>>(
      whitespaceValue));
  EXPECT_EQ(
      std::get<CSSCommaSeparatedList<CSSNumber>>(whitespaceValue).size(), 1);
  EXPECT_EQ(
      std::get<CSSCommaSeparatedList<CSSNumber>>(whitespaceValue)[0].value, 20);
}

TEST(CSSCommaSeparatedList, wrong_type) {
  auto simpleValue = parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>("20px");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(simpleValue));
}

TEST(CSSCommaSeparatedList, multiple_values) {
  auto simpleValue =
      parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>("20, 30, 40");
  EXPECT_TRUE(
      std::holds_alternative<CSSCommaSeparatedList<CSSNumber>>(simpleValue));
  EXPECT_EQ(std::get<CSSCommaSeparatedList<CSSNumber>>(simpleValue).size(), 3);
  EXPECT_EQ(
      std::get<CSSCommaSeparatedList<CSSNumber>>(simpleValue)[0].value, 20);
  EXPECT_EQ(
      std::get<CSSCommaSeparatedList<CSSNumber>>(simpleValue)[1].value, 30);
  EXPECT_EQ(
      std::get<CSSCommaSeparatedList<CSSNumber>>(simpleValue)[2].value, 40);

  auto whitespaceValue =
      parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>(" 20 , 30 , 40 ");
  EXPECT_TRUE(std::holds_alternative<CSSCommaSeparatedList<CSSNumber>>(
      whitespaceValue));
  EXPECT_EQ(
      std::get<CSSCommaSeparatedList<CSSNumber>>(whitespaceValue).size(), 3);
  EXPECT_EQ(
      std::get<CSSCommaSeparatedList<CSSNumber>>(whitespaceValue)[0].value, 20);
  EXPECT_EQ(
      std::get<CSSCommaSeparatedList<CSSNumber>>(whitespaceValue)[1].value, 30);
  EXPECT_EQ(
      std::get<CSSCommaSeparatedList<CSSNumber>>(whitespaceValue)[2].value, 40);
}

TEST(CSSCommaSeparatedList, extra_tokens) {
  auto extraTokensValue =
      parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>("20, 30, 40 50");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(extraTokensValue));
}

TEST(CSSCommaSeparatedList, extra_commas) {
  auto prefixCommaValue =
      parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>(",20");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(prefixCommaValue));

  auto suffixCommaValue =
      parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>("20,");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(suffixCommaValue));
}

} // namespace facebook::react
