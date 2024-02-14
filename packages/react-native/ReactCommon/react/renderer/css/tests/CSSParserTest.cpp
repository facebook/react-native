/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSParser.h>

namespace facebook::react {

TEST(CSSParser, keyword_values) {
  auto emptyValue = parseCSSValue<CSSKeyword>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(emptyValue.getKeyword(), CSSKeyword::Unset);

  auto autoValue = parseCSSValue<CSSKeyword>("auto");
  EXPECT_EQ(autoValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoValue.getKeyword(), CSSKeyword::Auto);

  auto autoCapsValue = parseCSSValue<CSSKeyword>("AuTO");
  EXPECT_EQ(autoCapsValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoCapsValue.getKeyword(), CSSKeyword::Auto);

  auto autoDisallowedValue = parseCSSValue<CSSFlexDirection>("auto");
  EXPECT_EQ(autoDisallowedValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoDisallowedValue.getKeyword(), CSSKeyword::Unset);

  auto whitespaceValue = parseCSSValue<CSSAlignItems>(" flex-start   ");
  EXPECT_EQ(whitespaceValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(whitespaceValue.getKeyword(), CSSAlignItems::FlexStart);

  auto badIdentValue = parseCSSValue<CSSWideKeyword>("bad");
  EXPECT_EQ(badIdentValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(badIdentValue.getKeyword(), CSSKeyword::Unset);

  auto pxValue = parseCSSValue<CSSKeyword>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(pxValue.getKeyword(), CSSKeyword::Unset);

  auto multiValue = parseCSSValue<CSSKeyword>("auto flex-start");
  EXPECT_EQ(multiValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(multiValue.getKeyword(), CSSKeyword::Unset);
}

TEST(CSSParser, length_values) {
  auto emptyValue = parseCSSValue<CSSAutoKeyword, CSSLength>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(emptyValue.getKeyword(), CSSKeyword::Unset);

  auto autoValue = parseCSSValue<CSSAutoKeyword, CSSLength>("auto");
  EXPECT_EQ(autoValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoValue.getKeyword(), CSSKeyword::Auto);

  auto pxValue = parseCSSValue<CSSAutoKeyword, CSSLength>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::Length);
  EXPECT_EQ(pxValue.getLength().value, 20.0f);
  EXPECT_EQ(pxValue.getLength().unit, CSSLengthUnit::Px);

  auto cmValue = parseCSSValue<CSSAutoKeyword, CSSLength>("453cm");
  EXPECT_EQ(cmValue.type(), CSSValueType::Length);
  EXPECT_EQ(cmValue.getLength().value, 453.0f);
  EXPECT_EQ(cmValue.getLength().unit, CSSLengthUnit::Cm);

  auto unitlessZeroValue = parseCSSValue<CSSAutoKeyword, CSSLength>("0");
  EXPECT_EQ(unitlessZeroValue.type(), CSSValueType::Length);
  EXPECT_EQ(unitlessZeroValue.getLength().value, 0.0f);
  EXPECT_EQ(unitlessZeroValue.getLength().unit, CSSLengthUnit::Px);

  auto unitlessNonzeroValue = parseCSSValue<CSSAutoKeyword, CSSLength>("123");
  EXPECT_EQ(unitlessNonzeroValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(unitlessNonzeroValue.getKeyword(), CSSKeyword::Unset);

  auto pctValue = parseCSSValue<CSSAutoKeyword, CSSLength>("-40%");
  EXPECT_EQ(pctValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(pctValue.getKeyword(), CSSKeyword::Unset);
}

TEST(CSSParser, length_percentage_values) {
  auto emptyValue = parseCSSValue<CSSAutoKeyword, CSSLength, CSSPercentage>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(emptyValue.getKeyword(), CSSKeyword::Unset);

  auto autoValue =
      parseCSSValue<CSSAutoKeyword, CSSLength, CSSPercentage>("auto");
  EXPECT_EQ(autoValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoValue.getKeyword(), CSSKeyword::Auto);

  auto pxValue =
      parseCSSValue<CSSAutoKeyword, CSSLength, CSSPercentage>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::Length);
  EXPECT_EQ(pxValue.getLength().value, 20.0f);
  EXPECT_EQ(pxValue.getLength().unit, CSSLengthUnit::Px);

  auto pctValue =
      parseCSSValue<CSSAutoKeyword, CSSLength, CSSPercentage>("-40%");
  EXPECT_EQ(pctValue.type(), CSSValueType::Percentage);
  EXPECT_EQ(pctValue.getPercentage().value, -40.0f);
}

TEST(CSSParser, number_values) {
  auto emptyValue = parseCSSValue<CSSKeyword, CSSNumber>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(emptyValue.getKeyword(), CSSKeyword::Unset);

  auto inheritValue = parseCSSValue<CSSKeyword, CSSNumber>("inherit");
  EXPECT_EQ(inheritValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(inheritValue.getKeyword(), CSSKeyword::Inherit);

  auto pxValue = parseCSSValue<CSSKeyword, CSSNumber>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(pxValue.getKeyword(), CSSKeyword::Unset);

  auto numberValue = parseCSSValue<CSSKeyword, CSSNumber>("123.456");
  EXPECT_EQ(numberValue.type(), CSSValueType::Number);
  EXPECT_EQ(numberValue.getNumber().value, 123.456f);

  auto unitlessZeroValue =
      parseCSSValue<CSSAutoKeyword, CSSLength, CSSNumber>("0");
  EXPECT_EQ(unitlessZeroValue.type(), CSSValueType::Number);
  EXPECT_EQ(unitlessZeroValue.getNumber().value, 0.0f);
}

} // namespace facebook::react
