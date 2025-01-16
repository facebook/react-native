/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSAngle.h>
#include <react/renderer/css/CSSColor.h>
#include <react/renderer/css/CSSKeyword.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSRatio.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSValueParser, keyword_values) {
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

TEST(CSSValueParser, length_values) {
  auto emptyValue = parseCSSProperty<CSSLength>("");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(emptyValue));

  auto autoValue = parseCSSProperty<CSSKeyword, CSSLength>("auto");
  EXPECT_TRUE(std::holds_alternative<CSSKeyword>(autoValue));
  EXPECT_EQ(std::get<CSSKeyword>(autoValue), CSSKeyword::Auto);

  auto pxValue = parseCSSProperty<CSSLength>("20px");
  EXPECT_TRUE(std::holds_alternative<CSSLength>(pxValue));
  EXPECT_EQ(std::get<CSSLength>(pxValue).value, 20.0f);
  EXPECT_EQ(std::get<CSSLength>(pxValue).unit, CSSLengthUnit::Px);

  auto capsValue = parseCSSProperty<CSSLength>("50PX");
  EXPECT_TRUE(std::holds_alternative<CSSLength>(capsValue));
  EXPECT_EQ(std::get<CSSLength>(capsValue).value, 50.0f);
  EXPECT_EQ(std::get<CSSLength>(capsValue).unit, CSSLengthUnit::Px);

  auto cmValue = parseCSSProperty<CSSLength>("453cm");
  EXPECT_TRUE(std::holds_alternative<CSSLength>(cmValue));
  EXPECT_TRUE(std::get<CSSLength>(cmValue).value == 453.0f);
  EXPECT_EQ(std::get<CSSLength>(cmValue).unit, CSSLengthUnit::Cm);

  auto unitlessZeroValue = parseCSSProperty<CSSLength>("0");
  EXPECT_TRUE(std::holds_alternative<CSSLength>(unitlessZeroValue));
  EXPECT_EQ(std::get<CSSLength>(unitlessZeroValue).value, 0.0f);
  EXPECT_EQ(std::get<CSSLength>(unitlessZeroValue).unit, CSSLengthUnit::Px);

  auto unitlessNonzeroValue = parseCSSProperty<CSSLength>("123");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(unitlessNonzeroValue));

  auto pctValue = parseCSSProperty<CSSLength>("-40%");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(pctValue));
}

TEST(CSSValueParser, length_percentage_values) {
  auto emptyValue = parseCSSProperty<CSSLength, CSSPercentage>("");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(emptyValue));

  auto autoValue =
      parseCSSProperty<CSSKeyword, CSSLength, CSSPercentage>("auto");
  EXPECT_TRUE(std::holds_alternative<CSSKeyword>(autoValue));
  EXPECT_EQ(std::get<CSSKeyword>(autoValue), CSSKeyword::Auto);

  auto pxValue = parseCSSProperty<CSSLength, CSSPercentage>("20px");
  EXPECT_TRUE(std::holds_alternative<CSSLength>(pxValue));
  EXPECT_EQ(std::get<CSSLength>(pxValue).value, 20.0f);
  EXPECT_EQ(std::get<CSSLength>(pxValue).unit, CSSLengthUnit::Px);

  auto pctValue = parseCSSProperty<CSSLength, CSSPercentage>("-40%");
  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(pctValue));
  EXPECT_EQ(std::get<CSSPercentage>(pctValue).value, -40.0f);
}

TEST(CSSValueParser, number_values) {
  auto emptyValue = parseCSSProperty<CSSNumber>("");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(emptyValue));

  auto pxValue = parseCSSProperty<CSSNumber>("20px");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(pxValue));

  auto numberValue = parseCSSProperty<CSSNumber>("123.456");
  EXPECT_TRUE(std::holds_alternative<CSSNumber>(numberValue));
  EXPECT_EQ(std::get<CSSNumber>(numberValue).value, 123.456f);

  auto unitlessZeroValue = parseCSSProperty<CSSNumber, CSSLength>("0");
  EXPECT_TRUE(std::holds_alternative<CSSNumber>(unitlessZeroValue));
  EXPECT_EQ(std::get<CSSNumber>(unitlessZeroValue).value, 0.0f);
}

TEST(CSSValueParser, ratio_values) {
  auto emptyValue = parseCSSProperty<CSSRatio>("");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(emptyValue));

  auto validRatio = parseCSSProperty<CSSRatio>("16/9");
  EXPECT_TRUE(std::holds_alternative<CSSRatio>(validRatio));
  EXPECT_EQ(std::get<CSSRatio>(validRatio).numerator, 16.0f);
  EXPECT_EQ(std::get<CSSRatio>(validRatio).denominator, 9.0f);

  auto validRatioWithWhitespace = parseCSSProperty<CSSRatio>("16 / 9");
  EXPECT_TRUE(std::holds_alternative<CSSRatio>(validRatioWithWhitespace));
  EXPECT_EQ(std::get<CSSRatio>(validRatioWithWhitespace).numerator, 16.0f);
  EXPECT_EQ(std::get<CSSRatio>(validRatioWithWhitespace).denominator, 9.0f);

  auto singleNumberRatio = parseCSSProperty<CSSRatio>("16");
  EXPECT_TRUE(std::holds_alternative<CSSRatio>(singleNumberRatio));
  EXPECT_EQ(std::get<CSSRatio>(singleNumberRatio).numerator, 16.0f);
  EXPECT_EQ(std::get<CSSRatio>(singleNumberRatio).denominator, 1.0f);

  auto fractionalNumber = parseCSSProperty<CSSRatio>("16.5");
  EXPECT_TRUE(std::holds_alternative<CSSRatio>(fractionalNumber));
  EXPECT_EQ(std::get<CSSRatio>(fractionalNumber).numerator, 16.5f);
  EXPECT_EQ(std::get<CSSRatio>(fractionalNumber).denominator, 1.0f);

  auto negativeNumber = parseCSSProperty<CSSRatio>("-16");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(negativeNumber));

  auto missingDenominator = parseCSSProperty<CSSRatio>("16/");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(missingDenominator));

  auto negativeNumerator = parseCSSProperty<CSSRatio>("-16/9");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(negativeNumerator));

  auto negativeDenominator = parseCSSProperty<CSSRatio>("16/-9");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(negativeDenominator));

  auto fractionalNumerator = parseCSSProperty<CSSRatio>("16.5/9");
  EXPECT_TRUE(std::holds_alternative<CSSRatio>(fractionalNumerator));
  EXPECT_EQ(std::get<CSSRatio>(fractionalNumerator).numerator, 16.5f);
  EXPECT_EQ(std::get<CSSRatio>(fractionalNumerator).denominator, 9.0f);

  auto fractionalDenominator = parseCSSProperty<CSSRatio>("16/9.5");
  EXPECT_TRUE(std::holds_alternative<CSSRatio>(fractionalDenominator));
  EXPECT_EQ(std::get<CSSRatio>(fractionalDenominator).numerator, 16.0f);

  auto degenerateRatio = parseCSSProperty<CSSRatio>("0");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(degenerateRatio));
}

TEST(CSSValueParser, angle_values) {
  auto emptyValue = parseCSSProperty<CSSAngle>("");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(emptyValue));

  auto degreeValue = parseCSSProperty<CSSAngle>("10deg");
  EXPECT_TRUE(std::holds_alternative<CSSAngle>(degreeValue));
  EXPECT_EQ(std::get<CSSAngle>(degreeValue).degrees, 10.0f);

  auto spongebobCaseValue = parseCSSProperty<CSSAngle>("20dEg");
  EXPECT_TRUE(std::holds_alternative<CSSAngle>(spongebobCaseValue));
  EXPECT_EQ(std::get<CSSAngle>(spongebobCaseValue).degrees, 20.0f);

  auto radianValue = parseCSSProperty<CSSAngle>("10rad");
  EXPECT_TRUE(std::holds_alternative<CSSAngle>(radianValue));
  ASSERT_NEAR(std::get<CSSAngle>(radianValue).degrees, 572.958f, 0.001f);

  auto negativeRadianValue = parseCSSProperty<CSSAngle>("-10rad");
  EXPECT_TRUE(std::holds_alternative<CSSAngle>(negativeRadianValue));
  ASSERT_NEAR(
      std::get<CSSAngle>(negativeRadianValue).degrees, -572.958f, 0.001f);

  auto gradianValue = parseCSSProperty<CSSAngle>("10grad");
  EXPECT_TRUE(std::holds_alternative<CSSAngle>(gradianValue));
  ASSERT_NEAR(std::get<CSSAngle>(gradianValue).degrees, 9.0f, 0.001f);

  auto turnValue = parseCSSProperty<CSSAngle>(".25turn");
  EXPECT_TRUE(std::holds_alternative<CSSAngle>(turnValue));
  EXPECT_EQ(std::get<CSSAngle>(turnValue).degrees, 90.0f);
}

TEST(CSSValueParser, parse_constexpr) {
  [[maybe_unused]] constexpr auto rowValue =
      parseCSSProperty<CSSKeyword>("row");

  [[maybe_unused]] constexpr auto pxValue = parseCSSProperty<CSSLength>("2px");
}

TEST(CSSValueParser, hex_color_values) {
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

TEST(CSSValueParser, named_colors) {
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

} // namespace facebook::react
