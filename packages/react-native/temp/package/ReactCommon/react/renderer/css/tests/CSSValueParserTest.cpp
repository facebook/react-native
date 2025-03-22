/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSValueParser, keyword_values) {
  auto emptyValue = parseCSSValue<CSSWideKeyword, CSSKeyword>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto autoValue = parseCSSValue<CSSWideKeyword, CSSKeyword>("auto");
  EXPECT_EQ(autoValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoValue.getKeyword(), CSSKeyword::Auto);

  auto autoCapsValue = parseCSSValue<CSSWideKeyword, CSSKeyword>("AuTO");
  EXPECT_EQ(autoCapsValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoCapsValue.getKeyword(), CSSKeyword::Auto);

  auto autoDisallowedValue = parseCSSValue<CSSWideKeyword>("auto");
  EXPECT_EQ(autoDisallowedValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(autoDisallowedValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto whitespaceValue =
      parseCSSValue<CSSWideKeyword, CSSKeyword>(" flex-start   ");
  EXPECT_EQ(whitespaceValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(whitespaceValue.getKeyword(), CSSKeyword::FlexStart);

  auto badIdentValue = parseCSSValue<CSSWideKeyword, CSSKeyword>("bad");
  EXPECT_EQ(badIdentValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(badIdentValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto pxValue = parseCSSValue<CSSWideKeyword>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(pxValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto multiValue = parseCSSValue<CSSWideKeyword>("auto flex-start");
  EXPECT_EQ(multiValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(multiValue.getCSSWideKeyword(), CSSWideKeyword::Unset);
}

TEST(CSSValueParser, length_values) {
  auto emptyValue = parseCSSValue<CSSWideKeyword, CSSLength>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto autoValue = parseCSSValue<CSSWideKeyword, CSSKeyword, CSSLength>("auto");
  EXPECT_EQ(autoValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoValue.getKeyword(), CSSKeyword::Auto);

  auto pxValue = parseCSSValue<CSSWideKeyword, CSSLength>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::Length);
  EXPECT_EQ(pxValue.getLength().value, 20.0f);
  EXPECT_EQ(pxValue.getLength().unit, CSSLengthUnit::Px);

  auto capsValue = parseCSSValue<CSSWideKeyword, CSSLength>("50PX");
  EXPECT_EQ(capsValue.type(), CSSValueType::Length);
  EXPECT_EQ(capsValue.getLength().value, 50.0f);
  EXPECT_EQ(capsValue.getLength().unit, CSSLengthUnit::Px);

  auto cmValue = parseCSSValue<CSSWideKeyword, CSSLength>("453cm");
  EXPECT_EQ(cmValue.type(), CSSValueType::Length);
  EXPECT_EQ(cmValue.getLength().value, 453.0f);
  EXPECT_EQ(cmValue.getLength().unit, CSSLengthUnit::Cm);

  auto unitlessZeroValue = parseCSSValue<CSSWideKeyword, CSSLength>("0");
  EXPECT_EQ(unitlessZeroValue.type(), CSSValueType::Length);
  EXPECT_EQ(unitlessZeroValue.getLength().value, 0.0f);
  EXPECT_EQ(unitlessZeroValue.getLength().unit, CSSLengthUnit::Px);

  auto unitlessNonzeroValue = parseCSSValue<CSSWideKeyword, CSSLength>("123");
  EXPECT_EQ(unitlessNonzeroValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(unitlessNonzeroValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto pctValue = parseCSSValue<CSSWideKeyword, CSSLength>("-40%");
  EXPECT_EQ(pctValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(pctValue.getCSSWideKeyword(), CSSWideKeyword::Unset);
}

TEST(CSSValueParser, length_percentage_values) {
  auto emptyValue = parseCSSValue<CSSWideKeyword, CSSLength, CSSPercentage>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto autoValue =
      parseCSSValue<CSSWideKeyword, CSSKeyword, CSSLength, CSSPercentage>(
          "auto");
  EXPECT_EQ(autoValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoValue.getKeyword(), CSSKeyword::Auto);

  auto pxValue =
      parseCSSValue<CSSWideKeyword, CSSLength, CSSPercentage>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::Length);
  EXPECT_EQ(pxValue.getLength().value, 20.0f);
  EXPECT_EQ(pxValue.getLength().unit, CSSLengthUnit::Px);

  auto pctValue =
      parseCSSValue<CSSWideKeyword, CSSLength, CSSPercentage>("-40%");
  EXPECT_EQ(pctValue.type(), CSSValueType::Percentage);
  EXPECT_EQ(pctValue.getPercentage().value, -40.0f);
}

TEST(CSSValueParser, number_values) {
  auto emptyValue = parseCSSValue<CSSWideKeyword, CSSNumber>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto inheritValue = parseCSSValue<CSSWideKeyword, CSSNumber>("inherit");
  EXPECT_EQ(inheritValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(inheritValue.getCSSWideKeyword(), CSSWideKeyword::Inherit);

  auto pxValue = parseCSSValue<CSSWideKeyword, CSSKeyword, CSSNumber>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(pxValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto numberValue =
      parseCSSValue<CSSWideKeyword, CSSKeyword, CSSNumber>("123.456");
  EXPECT_EQ(numberValue.type(), CSSValueType::Number);
  EXPECT_EQ(numberValue.getNumber().value, 123.456f);

  auto unitlessZeroValue =
      parseCSSValue<CSSWideKeyword, CSSLength, CSSNumber>("0");
  EXPECT_EQ(unitlessZeroValue.type(), CSSValueType::Number);
  EXPECT_EQ(unitlessZeroValue.getNumber().value, 0.0f);
}

TEST(CSSValueParser, ratio_values) {
  auto emptyValue = parseCSSValue<CSSWideKeyword, CSSRatio>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto validRatio = parseCSSValue<CSSWideKeyword, CSSRatio>("16/9");
  EXPECT_EQ(validRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(validRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(validRatio.getRatio().denominator, 9.0f);

  auto validRatioWithWhitespace =
      parseCSSValue<CSSWideKeyword, CSSRatio>("16 / 9");
  EXPECT_EQ(validRatioWithWhitespace.type(), CSSValueType::Ratio);
  EXPECT_EQ(validRatioWithWhitespace.getRatio().numerator, 16.0f);
  EXPECT_EQ(validRatioWithWhitespace.getRatio().denominator, 9.0f);

  auto singleNumberRatio = parseCSSValue<CSSWideKeyword, CSSRatio>("16");
  EXPECT_EQ(singleNumberRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(singleNumberRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(singleNumberRatio.getRatio().denominator, 1.0f);

  auto fractionalNumber = parseCSSValue<CSSWideKeyword, CSSRatio>("16.5");
  EXPECT_EQ(fractionalNumber.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalNumber.getRatio().numerator, 16.5f);
  EXPECT_EQ(fractionalNumber.getRatio().denominator, 1.0f);

  auto negativeNumber = parseCSSValue<CSSWideKeyword, CSSRatio>("-16");
  EXPECT_EQ(negativeNumber.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(negativeNumber.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto missingDenominator = parseCSSValue<CSSWideKeyword, CSSRatio>("16/");
  EXPECT_EQ(missingDenominator.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(missingDenominator.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto negativeNumerator = parseCSSValue<CSSWideKeyword, CSSRatio>("-16/9");
  EXPECT_EQ(negativeNumerator.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(negativeNumerator.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto negativeDenominator = parseCSSValue<CSSWideKeyword, CSSRatio>("16/-9");
  EXPECT_EQ(negativeDenominator.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(negativeDenominator.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto fractionalNumerator = parseCSSValue<CSSWideKeyword, CSSRatio>("16.5/9");
  EXPECT_EQ(fractionalNumerator.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalNumerator.getRatio().numerator, 16.5f);
  EXPECT_EQ(fractionalNumerator.getRatio().denominator, 9.0f);

  auto fractionalDenominator =
      parseCSSValue<CSSWideKeyword, CSSRatio>("16/9.5");
  EXPECT_EQ(fractionalDenominator.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalDenominator.getRatio().numerator, 16.0f);
  EXPECT_EQ(fractionalDenominator.getRatio().denominator, 9.5f);

  auto degenerateRatio = parseCSSValue<CSSWideKeyword, CSSRatio>("0");
  EXPECT_EQ(degenerateRatio.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(degenerateRatio.getCSSWideKeyword(), CSSWideKeyword::Unset);
}

TEST(CSSValueParser, number_ratio_values) {
  auto emptyValue = parseCSSValue<CSSWideKeyword, CSSNumber, CSSRatio>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto validRatio = parseCSSValue<CSSWideKeyword, CSSNumber, CSSRatio>("16/9");
  EXPECT_EQ(validRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(validRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(validRatio.getRatio().denominator, 9.0f);

  auto validRatioWithWhitespace =
      parseCSSValue<CSSWideKeyword, CSSNumber, CSSRatio>("16 / 9");
  EXPECT_EQ(validRatioWithWhitespace.type(), CSSValueType::Ratio);
  EXPECT_EQ(validRatioWithWhitespace.getRatio().numerator, 16.0f);
  EXPECT_EQ(validRatioWithWhitespace.getRatio().denominator, 9.0f);

  auto singleNumberRatio =
      parseCSSValue<CSSWideKeyword, CSSNumber, CSSRatio>("16");
  EXPECT_EQ(singleNumberRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(singleNumberRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(singleNumberRatio.getRatio().denominator, 1.0f);

  auto fractionalNumber =
      parseCSSValue<CSSWideKeyword, CSSNumber, CSSRatio>("16.5");
  EXPECT_EQ(fractionalNumber.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalNumber.getRatio().numerator, 16.5f);
  EXPECT_EQ(singleNumberRatio.getRatio().denominator, 1.0f);

  auto negativeNumber =
      parseCSSValue<CSSWideKeyword, CSSNumber, CSSRatio>("-16");
  EXPECT_EQ(negativeNumber.type(), CSSValueType::Number);
  EXPECT_EQ(negativeNumber.getNumber().value, -16.0f);

  auto missingDenominator =
      parseCSSValue<CSSWideKeyword, CSSNumber, CSSRatio>("16/");
  EXPECT_EQ(missingDenominator.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(missingDenominator.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto negativeNumerator =
      parseCSSValue<CSSWideKeyword, CSSNumber, CSSRatio>("-16/9");
  EXPECT_EQ(negativeNumerator.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(negativeNumerator.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto negativeDenominator =
      parseCSSValue<CSSWideKeyword, CSSNumber, CSSRatio>("16/-9");
  EXPECT_EQ(negativeDenominator.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(negativeDenominator.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto fractionalNumerator =
      parseCSSValue<CSSWideKeyword, CSSNumber, CSSRatio>("16.5/9");
  EXPECT_EQ(fractionalNumerator.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalNumerator.getRatio().numerator, 16.5f);
  EXPECT_EQ(fractionalNumerator.getRatio().denominator, 9.0f);

  auto fractionalDenominator =
      parseCSSValue<CSSWideKeyword, CSSNumber, CSSRatio>("16/9.5");
  EXPECT_EQ(fractionalDenominator.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalDenominator.getRatio().numerator, 16.0f);
  EXPECT_EQ(fractionalDenominator.getRatio().denominator, 9.5f);

  auto degenerateRatio =
      parseCSSValue<CSSWideKeyword, CSSNumber, CSSRatio>("0");
  EXPECT_EQ(degenerateRatio.type(), CSSValueType::Number);
  EXPECT_EQ(degenerateRatio.getNumber().value, 0.0f);
}

TEST(CSSValueParser, angle_values) {
  auto emptyValue = parseCSSValue<CSSWideKeyword, CSSAngle>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto degreeValue = parseCSSValue<CSSWideKeyword, CSSAngle>("10deg");
  EXPECT_EQ(degreeValue.type(), CSSValueType::Angle);
  EXPECT_EQ(degreeValue.getAngle().degrees, 10.0f);

  auto spongebobCaseValue = parseCSSValue<CSSWideKeyword, CSSAngle>("20dEg");
  EXPECT_EQ(spongebobCaseValue.type(), CSSValueType::Angle);
  EXPECT_EQ(spongebobCaseValue.getAngle().degrees, 20.0f);

  auto radianValue = parseCSSValue<CSSWideKeyword, CSSAngle>("10rad");
  EXPECT_EQ(radianValue.type(), CSSValueType::Angle);
  EXPECT_NEAR(radianValue.getAngle().degrees, 572.958f, 0.001f);

  auto negativeRadianValue = parseCSSValue<CSSWideKeyword, CSSAngle>("-10rad");
  EXPECT_EQ(negativeRadianValue.type(), CSSValueType::Angle);
  EXPECT_NEAR(negativeRadianValue.getAngle().degrees, -572.958f, 0.001f);

  auto gradianValue = parseCSSValue<CSSWideKeyword, CSSAngle>("10grad");
  EXPECT_EQ(gradianValue.type(), CSSValueType::Angle);
  ASSERT_NEAR(gradianValue.getAngle().degrees, 9.0f, 0.001f);

  auto turnValue = parseCSSValue<CSSWideKeyword, CSSAngle>(".25turn");
  EXPECT_EQ(turnValue.type(), CSSValueType::Angle);
  EXPECT_EQ(turnValue.getAngle().degrees, 90.0f);
}

TEST(CSSValueParser, parse_prop) {
  auto emptyValue = parseCSSProp<CSSProp::Width>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto numberWidthValue = parseCSSProp<CSSProp::Width>("50px");
  EXPECT_EQ(numberWidthValue.type(), CSSValueType::Length);
  EXPECT_EQ(numberWidthValue.getLength().value, 50.0f);
  EXPECT_EQ(numberWidthValue.getLength().unit, CSSLengthUnit::Px);

  auto percentWidthValue = parseCSSProp<CSSProp::Width>("50%");
  EXPECT_EQ(percentWidthValue.type(), CSSValueType::Percentage);
  EXPECT_EQ(percentWidthValue.getPercentage().value, 50.0f);

  auto autoWidthValue = parseCSSProp<CSSProp::Width>("auto");
  EXPECT_EQ(autoWidthValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoWidthValue.getKeyword(), CSSKeyword::Auto);

  auto invalidWidthValue = parseCSSProp<CSSProp::Width>("50");
  EXPECT_EQ(invalidWidthValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(invalidWidthValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto invalidKeywordValue = parseCSSProp<CSSProp::Width>("flex-start");
  EXPECT_EQ(invalidKeywordValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(invalidKeywordValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto keywordlessValue = parseCSSProp<CSSProp::BorderRadius>("50px");
  EXPECT_EQ(keywordlessValue.type(), CSSValueType::Length);
  EXPECT_EQ(keywordlessValue.getLength().value, 50.0f);
  EXPECT_EQ(keywordlessValue.getLength().unit, CSSLengthUnit::Px);
}

TEST(CSSValueParser, parse_keyword_prop_constexpr) {
  constexpr auto rowValue = parseCSSProp<CSSProp::FlexDirection>("row");
  EXPECT_EQ(rowValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(rowValue.getKeyword(), CSSKeyword::Row);
}

TEST(CSSValueParser, parse_length_prop_constexpr) {
  constexpr auto pxValue = parseCSSProp<CSSProp::BorderWidth>("2px");
  EXPECT_EQ(pxValue.type(), CSSValueType::Length);
  EXPECT_EQ(pxValue.getLength().value, 2.0f);
  EXPECT_EQ(pxValue.getLength().unit, CSSLengthUnit::Px);
}

TEST(CSSValueParser, hex_color_values) {
  auto emptyValue = parseCSSValue<CSSWideKeyword, CSSColor>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto hex3DigitColorValue = parseCSSValue<CSSWideKeyword, CSSColor>("#fff");
  EXPECT_EQ(hex3DigitColorValue.type(), CSSValueType::Color);
  EXPECT_EQ(hex3DigitColorValue.getColor().r, 255);
  EXPECT_EQ(hex3DigitColorValue.getColor().g, 255);
  EXPECT_EQ(hex3DigitColorValue.getColor().b, 255);
  EXPECT_EQ(hex3DigitColorValue.getColor().a, 255);

  auto hex4DigitColorValue = parseCSSValue<CSSWideKeyword, CSSColor>("#ffff");
  EXPECT_EQ(hex4DigitColorValue.type(), CSSValueType::Color);
  EXPECT_EQ(hex4DigitColorValue.getColor().r, 255);
  EXPECT_EQ(hex4DigitColorValue.getColor().g, 255);
  EXPECT_EQ(hex4DigitColorValue.getColor().b, 255);
  EXPECT_EQ(hex4DigitColorValue.getColor().a, 255);

  auto hex6DigitColorValue = parseCSSValue<CSSWideKeyword, CSSColor>("#ffffff");
  EXPECT_EQ(hex6DigitColorValue.type(), CSSValueType::Color);
  EXPECT_EQ(hex6DigitColorValue.getColor().r, 255);
  EXPECT_EQ(hex6DigitColorValue.getColor().g, 255);
  EXPECT_EQ(hex6DigitColorValue.getColor().b, 255);
  EXPECT_EQ(hex6DigitColorValue.getColor().a, 255);

  auto hex8DigitColorValue =
      parseCSSValue<CSSWideKeyword, CSSColor>("#ffffffff");
  EXPECT_EQ(hex8DigitColorValue.type(), CSSValueType::Color);
  EXPECT_EQ(hex8DigitColorValue.getColor().r, 255);
  EXPECT_EQ(hex8DigitColorValue.getColor().g, 255);
  EXPECT_EQ(hex8DigitColorValue.getColor().b, 255);
  EXPECT_EQ(hex8DigitColorValue.getColor().a, 255);

  auto hexMixedCaseColorValue =
      parseCSSValue<CSSWideKeyword, CSSColor>("#FFCc99");
  EXPECT_EQ(hexMixedCaseColorValue.type(), CSSValueType::Color);
  EXPECT_EQ(hexMixedCaseColorValue.getColor().r, 255);
  EXPECT_EQ(hexMixedCaseColorValue.getColor().g, 204);
  EXPECT_EQ(hexMixedCaseColorValue.getColor().b, 153);
  EXPECT_EQ(hexMixedCaseColorValue.getColor().a, 255);

  auto hexDigitOnlyColorValue = parseCSSValue<CSSWideKeyword, CSSColor>("#369");
  EXPECT_EQ(hexDigitOnlyColorValue.type(), CSSValueType::Color);
  EXPECT_EQ(hexDigitOnlyColorValue.getColor().r, 51);
  EXPECT_EQ(hexDigitOnlyColorValue.getColor().g, 102);
  EXPECT_EQ(hexDigitOnlyColorValue.getColor().b, 153);
  EXPECT_EQ(hexDigitOnlyColorValue.getColor().a, 255);

  auto hexAlphaTestValue = parseCSSValue<CSSWideKeyword, CSSColor>("#FFFFFFCC");
  EXPECT_EQ(hexAlphaTestValue.type(), CSSValueType::Color);
  EXPECT_EQ(hexAlphaTestValue.getColor().r, 255);
  EXPECT_EQ(hexAlphaTestValue.getColor().g, 255);
  EXPECT_EQ(hexAlphaTestValue.getColor().b, 255);
  EXPECT_EQ(hexAlphaTestValue.getColor().a, 204);
}

TEST(CSSValueParser, named_colors) {
  auto invalidNamedColorTestValue =
      parseCSSValue<CSSWideKeyword, CSSColor>("redd");
  EXPECT_EQ(invalidNamedColorTestValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(
      invalidNamedColorTestValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto namedColorTestValue1 = parseCSSValue<CSSWideKeyword, CSSColor>("red");
  EXPECT_EQ(namedColorTestValue1.type(), CSSValueType::Color);
  EXPECT_EQ(namedColorTestValue1.getColor().r, 255);
  EXPECT_EQ(namedColorTestValue1.getColor().g, 0);
  EXPECT_EQ(namedColorTestValue1.getColor().b, 0);
  EXPECT_EQ(namedColorTestValue1.getColor().a, 255);

  auto namedColorTestValue2 =
      parseCSSValue<CSSWideKeyword, CSSColor>("cornsilk");
  EXPECT_EQ(namedColorTestValue2.type(), CSSValueType::Color);
  EXPECT_EQ(namedColorTestValue2.getColor().r, 255);
  EXPECT_EQ(namedColorTestValue2.getColor().g, 248);
  EXPECT_EQ(namedColorTestValue2.getColor().b, 220);
  EXPECT_EQ(namedColorTestValue2.getColor().a, 255);

  auto namedColorMixedCaseTestValue =
      parseCSSValue<CSSWideKeyword, CSSColor>("sPrINgGrEEn");
  EXPECT_EQ(namedColorMixedCaseTestValue.type(), CSSValueType::Color);
  EXPECT_EQ(namedColorMixedCaseTestValue.getColor().r, 0);
  EXPECT_EQ(namedColorMixedCaseTestValue.getColor().g, 255);
  EXPECT_EQ(namedColorMixedCaseTestValue.getColor().b, 127);
  EXPECT_EQ(namedColorMixedCaseTestValue.getColor().a, 255);
}
} // namespace facebook::react
