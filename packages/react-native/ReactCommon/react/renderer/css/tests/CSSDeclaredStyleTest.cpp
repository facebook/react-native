/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSDeclaredStyle.h>
#include <react/renderer/css/CSSParser.h>

namespace facebook::react {

TEST(CSSDeclaredStyle, unset_keyword) {
  CSSDeclaredStyle style;
  auto value = style.get<CSSProp::FlexDirection>();
  EXPECT_EQ(value.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(value.getCSSWideKeyword(), CSSWideKeyword::Unset);
}

TEST(CSSDeclaredStyle, unset_ratio) {
  CSSDeclaredStyle style;
  auto value = style.get<CSSProp::AspectRatio>();
  EXPECT_EQ(value.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(value.getCSSWideKeyword(), CSSWideKeyword::Unset);
}

TEST(CSSDeclaredStyle, set_keyword) {
  CSSDeclaredStyle style;

  style.set<CSSProp::FlexDirection>("row");

  auto value = style.get<CSSProp::FlexDirection>();
  EXPECT_EQ(value.type(), CSSValueType::Keyword);
  EXPECT_EQ(
      value.getKeyword(), CSSAllowedKeywords<CSSProp::FlexDirection>::Row);
}

TEST(CSSDeclaredStyle, set_ratio) {
  CSSDeclaredStyle style;

  style.set<CSSProp::AspectRatio>("16 / 9");

  auto value = style.get<CSSProp::AspectRatio>();
  EXPECT_EQ(value.type(), CSSValueType::Ratio);
  EXPECT_EQ(value.getRatio().numerator, 16.0f);
  EXPECT_EQ(value.getRatio().denominator, 9.0f);
}

TEST(CSSDeclaredStyle, overwrite_ratio) {
  CSSDeclaredStyle style;

  style.set<CSSProp::AspectRatio>("16 / 9");

  auto value1 = style.get<CSSProp::AspectRatio>();
  EXPECT_EQ(value1.type(), CSSValueType::Ratio);
  EXPECT_EQ(value1.getRatio().numerator, 16.0f);
  EXPECT_EQ(value1.getRatio().denominator, 9.0f);

  style.set<CSSProp::AspectRatio>("4/3");

  auto value2 = style.get<CSSProp::AspectRatio>();
  EXPECT_EQ(value2.type(), CSSValueType::Ratio);
  EXPECT_EQ(value2.getRatio().numerator, 4.0f);
  EXPECT_EQ(value2.getRatio().denominator, 3.0f);
}

TEST(CSSDeclaredStyle, set_multiple) {
  CSSDeclaredStyle style;

  style.set<CSSProp::FlexDirection>("row");
  style.set<CSSProp::AspectRatio>("16 / 9");

  auto flexDirection = style.get<CSSProp::FlexDirection>();
  EXPECT_EQ(flexDirection.type(), CSSValueType::Keyword);
  EXPECT_EQ(
      flexDirection.getKeyword(),
      CSSAllowedKeywords<CSSProp::FlexDirection>::Row);

  auto aspectRatio = style.get<CSSProp::AspectRatio>();
  EXPECT_EQ(aspectRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(aspectRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(aspectRatio.getRatio().denominator, 9.0f);
}

TEST(CSSDeclaredStyle, set_multiple_overwrite) {
  CSSDeclaredStyle style;

  style.set<CSSProp::FlexDirection>("row");
  style.set<CSSProp::AspectRatio>("16 / 9");
  style.set<CSSProp::FlexDirection>("column");

  auto flexDirection = style.get<CSSProp::FlexDirection>();
  EXPECT_EQ(flexDirection.type(), CSSValueType::Keyword);
  EXPECT_EQ(
      flexDirection.getKeyword(),
      CSSAllowedKeywords<CSSProp::FlexDirection>::Column);

  auto aspectRatio = style.get<CSSProp::AspectRatio>();
  EXPECT_EQ(aspectRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(aspectRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(aspectRatio.getRatio().denominator, 9.0f);
}

TEST(CSSDeclaredStyle, set_multiple_reset) {
  CSSDeclaredStyle style;

  style.set<CSSProp::FlexDirection>("row");
  style.set<CSSProp::AspectRatio>("16 / 9");
  style.set<CSSProp::FlexDirection>("");

  auto flexDirection = style.get<CSSProp::FlexDirection>();
  EXPECT_EQ(flexDirection.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(flexDirection.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto aspectRatio = style.get<CSSProp::AspectRatio>();
  EXPECT_EQ(aspectRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(aspectRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(aspectRatio.getRatio().denominator, 9.0f);
}

TEST(CSSDeclaredStyle, get_with_precedence) {
  CSSDeclaredStyle style;

  style.set<CSSProp::Margin>("1px");

  auto margin1 = style.get<
      CSSProp::MarginStart,
      CSSProp::MarginLeft,
      CSSProp::MarginInline,
      CSSProp::MarginHorizontal,
      CSSProp::Margin>();

  EXPECT_EQ(margin1.type(), CSSValueType::Length);
  EXPECT_EQ(margin1.getLength().value, 1.0f);
  EXPECT_EQ(margin1.getLength().unit, CSSLengthUnit::Px);

  style.set<CSSProp::MarginLeft>("3px");
  auto margin2 = style.get<
      CSSProp::MarginStart,
      CSSProp::MarginLeft,
      CSSProp::MarginInline,
      CSSProp::MarginHorizontal,
      CSSProp::Margin>();

  EXPECT_EQ(margin2.type(), CSSValueType::Length);
  EXPECT_EQ(margin2.getLength().value, 3.0f);
  EXPECT_EQ(margin2.getLength().unit, CSSLengthUnit::Px);
}

} // namespace facebook::react
