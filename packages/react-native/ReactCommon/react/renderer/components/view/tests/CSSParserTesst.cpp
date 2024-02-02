/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/components/view/CSSParser.h>

namespace facebook::react {

TEST(CSSParser, keyword_values) {
  auto emptyValue = parseCSSValue<CSSKeywordValue>("");
  EXPECT_EQ(emptyValue.type, CSSValueType::Undefined);

  auto autoValue = parseCSSValue<CSSKeywordValue>("auto");
  EXPECT_EQ(autoValue.type, CSSValueType::Keyword);
  EXPECT_EQ(autoValue.keyword, CSSKeyword::Auto);

  auto autoCapsValue = parseCSSValue<CSSKeywordValue>("AuTO");
  EXPECT_EQ(autoCapsValue.type, CSSValueType::Keyword);
  EXPECT_EQ(autoCapsValue.keyword, CSSKeyword::Auto);

  auto whitespaceValue = parseCSSValue<CSSKeywordValue>(" flex-start   ");
  EXPECT_EQ(whitespaceValue.type, CSSValueType::Keyword);
  EXPECT_EQ(whitespaceValue.keyword, CSSKeyword::FlexStart);

  auto badIdentValue = parseCSSValue<CSSKeywordValue>("bad");
  EXPECT_EQ(badIdentValue.type, CSSValueType::Undefined);

  auto pxValue = parseCSSValue<CSSKeywordValue>("20px");
  EXPECT_EQ(pxValue.type, CSSValueType::Undefined);

  auto multiValue = parseCSSValue<CSSKeywordValue>("auto flex-start");
  EXPECT_EQ(multiValue.type, CSSValueType::Undefined);
}

TEST(CSSParser, length_values) {
  auto emptyValue = parseCSSValue<CSSLengthValue>("");
  EXPECT_EQ(emptyValue.type, CSSValueType::Undefined);

  auto autoValue = parseCSSValue<CSSLengthValue>("auto");
  EXPECT_EQ(autoValue.type, CSSValueType::Keyword);
  EXPECT_EQ(autoValue.keyword, CSSKeyword::Auto);

  auto pxValue = parseCSSValue<CSSLengthValue>("20px");
  EXPECT_EQ(pxValue.type, CSSValueType::Length);
  EXPECT_EQ(pxValue.length.value, 20.0f);
  EXPECT_EQ(pxValue.length.unit, CSSLengthUnit::Px);

  auto pctValue = parseCSSValue<CSSLengthValue>("-40%");
  EXPECT_EQ(pctValue.type, CSSValueType::Undefined);
}

TEST(CSSParser, length_percentage_values) {
  auto emptyValue = parseCSSValue<CSSLengthPercentageValue>("");
  EXPECT_EQ(emptyValue.type, CSSValueType::Undefined);

  auto autoValue = parseCSSValue<CSSLengthPercentageValue>("auto");
  EXPECT_EQ(autoValue.type, CSSValueType::Keyword);
  EXPECT_EQ(autoValue.keyword, CSSKeyword::Auto);

  auto pxValue = parseCSSValue<CSSLengthPercentageValue>("20px");
  EXPECT_EQ(pxValue.type, CSSValueType::Length);
  EXPECT_EQ(pxValue.length.value, 20.0f);
  EXPECT_EQ(pxValue.length.unit, CSSLengthUnit::Px);

  auto pctValue = parseCSSValue<CSSLengthPercentageValue>("-40%");
  EXPECT_EQ(pctValue.type, CSSValueType::Percent);
  EXPECT_EQ(pctValue.percent.value, -40.0f);
}

TEST(CSSParser, number_values) {
  auto emptyValue = parseCSSValue<CSSNumberValue>("");
  EXPECT_EQ(emptyValue.type, CSSValueType::Undefined);

  auto inheritValue = parseCSSValue<CSSNumberValue>("inherit");
  EXPECT_EQ(inheritValue.type, CSSValueType::Keyword);
  EXPECT_EQ(inheritValue.keyword, CSSKeyword::Inherit);

  auto pxValue = parseCSSValue<CSSNumberValue>("20px");
  EXPECT_EQ(pxValue.type, CSSValueType::Undefined);

  auto numberValue = parseCSSValue<CSSNumberValue>("123.456");
  EXPECT_EQ(numberValue.type, CSSValueType::Number);
  EXPECT_EQ(numberValue.number.value, 123.456f);
}

} // namespace facebook::react
