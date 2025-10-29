/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSCompoundDataType.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSList.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSList, empty_values) {
  auto emptyValue = parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>("");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(emptyValue));

  auto whitespaceValue =
      parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>(" ");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(whitespaceValue));

  auto commaValue = parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>(",");
}

TEST(CSSList, single_value) {
  auto simpleValue = parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>("20");
  EXPECT_TRUE(
      std::holds_alternative<CSSCommaSeparatedList<CSSNumber>>(simpleValue));
  EXPECT_EQ(std::get<CSSCommaSeparatedList<CSSNumber>>(simpleValue).size(), 1);
  EXPECT_EQ(
      std::get<CSSCommaSeparatedList<CSSNumber>>(simpleValue)[0].value, 20);

  auto whitespaceValue =
      parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>(" 20 ");
  EXPECT_TRUE(
      std::holds_alternative<CSSCommaSeparatedList<CSSNumber>>(
          whitespaceValue));
  EXPECT_EQ(
      std::get<CSSCommaSeparatedList<CSSNumber>>(whitespaceValue).size(), 1);
  EXPECT_EQ(
      std::get<CSSCommaSeparatedList<CSSNumber>>(whitespaceValue)[0].value, 20);
}

TEST(CSSList, wrong_type) {
  auto simpleValue = parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>("20px");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(simpleValue));
}

TEST(CSSList, multiple_comma_values) {
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
  EXPECT_TRUE(
      std::holds_alternative<CSSCommaSeparatedList<CSSNumber>>(
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

TEST(CSSList, multiple_space_values) {
  auto simpleValue =
      parseCSSProperty<CSSWhitespaceSeparatedList<CSSNumber>>("20 30 40");
  EXPECT_TRUE(
      std::holds_alternative<CSSWhitespaceSeparatedList<CSSNumber>>(
          simpleValue));
  EXPECT_EQ(
      std::get<CSSWhitespaceSeparatedList<CSSNumber>>(simpleValue).size(), 3);
  EXPECT_EQ(
      std::get<CSSWhitespaceSeparatedList<CSSNumber>>(simpleValue)[0].value,
      20);
  EXPECT_EQ(
      std::get<CSSWhitespaceSeparatedList<CSSNumber>>(simpleValue)[1].value,
      30);
  EXPECT_EQ(
      std::get<CSSWhitespaceSeparatedList<CSSNumber>>(simpleValue)[2].value,
      40);

  auto whitespaceValue =
      parseCSSProperty<CSSWhitespaceSeparatedList<CSSNumber>>(" 20 \n 30  40 ");
  EXPECT_TRUE(
      std::holds_alternative<CSSWhitespaceSeparatedList<CSSNumber>>(
          whitespaceValue));
  EXPECT_EQ(
      std::get<CSSWhitespaceSeparatedList<CSSNumber>>(whitespaceValue).size(),
      3);
  EXPECT_EQ(
      std::get<CSSWhitespaceSeparatedList<CSSNumber>>(whitespaceValue)[0].value,
      20);
  EXPECT_EQ(
      std::get<CSSWhitespaceSeparatedList<CSSNumber>>(whitespaceValue)[1].value,
      30);
  EXPECT_EQ(
      std::get<CSSWhitespaceSeparatedList<CSSNumber>>(whitespaceValue)[2].value,
      40);
}

TEST(CSSList, extra_comma_tokens) {
  auto extraTokensValue =
      parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>("20, 30, 40 50");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(extraTokensValue));
}

TEST(CSSList, extra_space_tokens) {
  auto extraTokensValue =
      parseCSSProperty<CSSWhitespaceSeparatedList<CSSNumber>>("20 30 40 ,50");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(extraTokensValue));
}

TEST(CSSList, extra_commas) {
  auto prefixCommaValue =
      parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>(",20");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(prefixCommaValue));

  auto suffixCommaValue =
      parseCSSProperty<CSSCommaSeparatedList<CSSNumber>>("20,");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(suffixCommaValue));
}

TEST(CSSList, compound_data_type) {
  using NumberLengthList =
      CSSCommaSeparatedList<CSSCompoundDataType<CSSNumber, CSSLength>>;

  auto compoundType = parseCSSProperty<NumberLengthList>("10px,20");

  EXPECT_TRUE(std::holds_alternative<NumberLengthList>(compoundType));
  auto& list = std::get<NumberLengthList>(compoundType);

  EXPECT_EQ(list.size(), 2);
  EXPECT_TRUE(std::holds_alternative<CSSLength>(list[0]));
  EXPECT_EQ(std::get<CSSLength>(list[0]).value, 10);
  EXPECT_EQ(std::get<CSSLength>(list[0]).unit, CSSLengthUnit::Px);

  EXPECT_TRUE(std::holds_alternative<CSSNumber>(list[1]));
  EXPECT_EQ(std::get<CSSNumber>(list[1]).value, 20);
}

} // namespace facebook::react
