/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSColor.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSColor, hex_color_values) {
  auto emptyValue = parseCSSProperty<CSSColor>("");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(emptyValue));

  auto hex3DigitColorValue = parseCSSProperty<CSSColor>("#fff");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hex3DigitColorValue));
  EXPECT_EQ(std::get<CSSColor>(hex3DigitColorValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(hex3DigitColorValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(hex3DigitColorValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(hex3DigitColorValue).a, 255);

  auto hex4DigitColorValue = parseCSSProperty<CSSColor>("#ffff");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hex4DigitColorValue));
  EXPECT_EQ(std::get<CSSColor>(hex4DigitColorValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(hex4DigitColorValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(hex4DigitColorValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(hex4DigitColorValue).a, 255);

  auto hex6DigitColorValue = parseCSSProperty<CSSColor>("#ffffff");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hex6DigitColorValue));
  EXPECT_EQ(std::get<CSSColor>(hex6DigitColorValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(hex6DigitColorValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(hex6DigitColorValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(hex6DigitColorValue).a, 255);

  auto hex8DigitColorValue = parseCSSProperty<CSSColor>("#ffffffff");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hex8DigitColorValue));
  EXPECT_EQ(std::get<CSSColor>(hex8DigitColorValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(hex8DigitColorValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(hex8DigitColorValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(hex8DigitColorValue).a, 255);

  auto hexMixedCaseColorValue = parseCSSProperty<CSSColor>("#FFCc99");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hexMixedCaseColorValue));
  EXPECT_EQ(std::get<CSSColor>(hexMixedCaseColorValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(hexMixedCaseColorValue).g, 204);
  EXPECT_EQ(std::get<CSSColor>(hexMixedCaseColorValue).b, 153);
  EXPECT_EQ(std::get<CSSColor>(hexMixedCaseColorValue).a, 255);

  auto hexDigitOnlyColorValue = parseCSSProperty<CSSColor>("#369");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hexDigitOnlyColorValue));
  EXPECT_EQ(std::get<CSSColor>(hexDigitOnlyColorValue).r, 51);
  EXPECT_EQ(std::get<CSSColor>(hexDigitOnlyColorValue).g, 102);
  EXPECT_EQ(std::get<CSSColor>(hexDigitOnlyColorValue).b, 153);
  EXPECT_EQ(std::get<CSSColor>(hexDigitOnlyColorValue).a, 255);

  auto hexAlphaTestValue = parseCSSProperty<CSSColor>("#FFFFFFCC");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(hexAlphaTestValue));
  EXPECT_EQ(std::get<CSSColor>(hexAlphaTestValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(hexAlphaTestValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(hexAlphaTestValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(hexAlphaTestValue).a, 204);
}

TEST(CSSColor, named_colors) {
  auto invalidNamedColorTestValue = parseCSSProperty<CSSColor>("redd");
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(invalidNamedColorTestValue));

  auto namedColorTestValue1 = parseCSSProperty<CSSColor>("red");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(namedColorTestValue1));
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue1).r, 255);
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue1).g, 0);
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue1).b, 0);
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue1).a, 255);

  auto namedColorTestValue2 = parseCSSProperty<CSSColor>("cornsilk");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(namedColorTestValue2));
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue2).r, 255);
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue2).g, 248);
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue2).b, 220);
  EXPECT_EQ(std::get<CSSColor>(namedColorTestValue2).a, 255);

  auto namedColorMixedCaseTestValue = parseCSSProperty<CSSColor>("sPrINgGrEEn");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(namedColorMixedCaseTestValue));
  EXPECT_EQ(std::get<CSSColor>(namedColorMixedCaseTestValue).r, 0);
  EXPECT_EQ(std::get<CSSColor>(namedColorMixedCaseTestValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(namedColorMixedCaseTestValue).b, 127);
  EXPECT_EQ(std::get<CSSColor>(namedColorMixedCaseTestValue).a, 255);

  auto transparentColor = parseCSSProperty<CSSColor>("transparent");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(transparentColor));
  EXPECT_EQ(std::get<CSSColor>(transparentColor).r, 0);
  EXPECT_EQ(std::get<CSSColor>(transparentColor).g, 0);
  EXPECT_EQ(std::get<CSSColor>(transparentColor).b, 0);
  EXPECT_EQ(std::get<CSSColor>(transparentColor).a, 0);
}

TEST(CSSColor, rgb_rgba_values) {
  auto simpleValue = parseCSSProperty<CSSColor>("rgb(255, 255, 255)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(simpleValue));
  EXPECT_EQ(std::get<CSSColor>(simpleValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(simpleValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(simpleValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(simpleValue).a, 255);

  auto capsValue = parseCSSProperty<CSSColor>("RGB(255, 255, 255)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(capsValue));
  EXPECT_EQ(std::get<CSSColor>(capsValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(capsValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(capsValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(capsValue).a, 255);

  auto modernSyntaxValue = parseCSSProperty<CSSColor>("rgb(255 255 255)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(modernSyntaxValue));
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(modernSyntaxValue).a, 255);

  auto mixedDelimeterValue = parseCSSProperty<CSSColor>("rgb(255,255 255)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(mixedDelimeterValue));
  EXPECT_EQ(std::get<CSSColor>(mixedDelimeterValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(mixedDelimeterValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(mixedDelimeterValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(mixedDelimeterValue).a, 255);

  auto mixedSpacingValue = parseCSSProperty<CSSColor>("rgb( 5   4,3)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(mixedSpacingValue));
  EXPECT_EQ(std::get<CSSColor>(mixedSpacingValue).r, 5);
  EXPECT_EQ(std::get<CSSColor>(mixedSpacingValue).g, 4);
  EXPECT_EQ(std::get<CSSColor>(mixedSpacingValue).b, 3);
  EXPECT_EQ(std::get<CSSColor>(mixedSpacingValue).a, 255);

  auto clampedValue = parseCSSProperty<CSSColor>("rgb(-50, 500, 0)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(clampedValue));
  EXPECT_EQ(std::get<CSSColor>(clampedValue).r, 0);
  EXPECT_EQ(std::get<CSSColor>(clampedValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(clampedValue).b, 0);
  EXPECT_EQ(std::get<CSSColor>(clampedValue).a, 255);

  auto fractionalValue = parseCSSProperty<CSSColor>("rgb(0.5, 0.5, 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(fractionalValue));
  EXPECT_EQ(std::get<CSSColor>(fractionalValue).r, 1);
  EXPECT_EQ(std::get<CSSColor>(fractionalValue).g, 1);
  EXPECT_EQ(std::get<CSSColor>(fractionalValue).b, 1);
  EXPECT_EQ(std::get<CSSColor>(fractionalValue).a, 255);

  auto percentageValue = parseCSSProperty<CSSColor>("rgb(50%, 50%, 50%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(percentageValue));
  EXPECT_EQ(std::get<CSSColor>(percentageValue).r, 128);
  EXPECT_EQ(std::get<CSSColor>(percentageValue).g, 128);
  EXPECT_EQ(std::get<CSSColor>(percentageValue).b, 128);

  auto mixedNumberPercentageValue =
      parseCSSProperty<CSSColor>("rgb(50%, 0.5, 50%)");
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(mixedNumberPercentageValue));

  auto rgbWithNumberAlphaValue =
      parseCSSProperty<CSSColor>("rgb(255 255 255 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(rgbWithNumberAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(rgbWithNumberAlphaValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithNumberAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithNumberAlphaValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithNumberAlphaValue).a, 128);

  auto rgbWithPercentageAlphaValue =
      parseCSSProperty<CSSColor>("rgb(255 255 255, 50%)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(rgbWithPercentageAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(rgbWithPercentageAlphaValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithPercentageAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithPercentageAlphaValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithPercentageAlphaValue).a, 128);

  auto rgbWithSolidusAlphaValue =
      parseCSSProperty<CSSColor>("rgb(255 255 255 / 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(rgbWithSolidusAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(rgbWithSolidusAlphaValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithSolidusAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithSolidusAlphaValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbWithSolidusAlphaValue).a, 128);

  auto rgbaWithSolidusAlphaValue =
      parseCSSProperty<CSSColor>("rgba(255 255 255 / 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(rgbaWithSolidusAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(rgbaWithSolidusAlphaValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithSolidusAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithSolidusAlphaValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithSolidusAlphaValue).a, 128);

  auto rgbaWithPercentageSolidusAlphaValue =
      parseCSSProperty<CSSColor>("rgba(255 255 255 / 50%)");
  EXPECT_TRUE(
      std::holds_alternative<CSSColor>(rgbaWithPercentageSolidusAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(rgbaWithPercentageSolidusAlphaValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithPercentageSolidusAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithPercentageSolidusAlphaValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithPercentageSolidusAlphaValue).a, 128);

  auto rgbaWithoutAlphaValue = parseCSSProperty<CSSColor>("rgba(255 255 255)");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(rgbaWithoutAlphaValue));
  EXPECT_EQ(std::get<CSSColor>(rgbaWithoutAlphaValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithoutAlphaValue).g, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithoutAlphaValue).b, 255);
  EXPECT_EQ(std::get<CSSColor>(rgbaWithoutAlphaValue).a, 255);

  auto surroundingWhitespaceValue =
      parseCSSProperty<CSSColor>("  rgb(255, 1, 2) ");
  EXPECT_TRUE(std::holds_alternative<CSSColor>(surroundingWhitespaceValue));
  EXPECT_EQ(std::get<CSSColor>(surroundingWhitespaceValue).r, 255);
  EXPECT_EQ(std::get<CSSColor>(surroundingWhitespaceValue).g, 1);
  EXPECT_EQ(std::get<CSSColor>(surroundingWhitespaceValue).b, 2);
  EXPECT_EQ(std::get<CSSColor>(surroundingWhitespaceValue).a, 255);

  auto valueWithSingleComponent = parseCSSProperty<CSSColor>("rgb(255)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(valueWithSingleComponent));

  auto valueWithTooFewComponents = parseCSSProperty<CSSColor>("rgb(255, 255)");
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(valueWithTooFewComponents));

  auto valueWithTooManyComponents =
      parseCSSProperty<CSSColor>("rgb(255, 255, 255, 255, 255)");
  EXPECT_TRUE(
      std::holds_alternative<std::monostate>(valueWithTooManyComponents));

  auto valueStartingWithComma = parseCSSProperty<CSSColor>("rgb(, 1, 2)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(valueStartingWithComma));

  auto valueEndingWithComma = parseCSSProperty<CSSColor>("rgb(1, 2, )");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(valueEndingWithComma));
}

TEST(CSSColor, constexpr_values) {
  [[maybe_unused]] constexpr auto simpleValue =
      parseCSSProperty<CSSColor>("rgb(255, 255, 255)");
}

} // namespace facebook::react
