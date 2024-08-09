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
  auto emptyValue = parseCSSComponentValue<CSSWideKeyword, CSSKeyword>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto autoValue = parseCSSComponentValue<CSSWideKeyword, CSSKeyword>("auto");
  EXPECT_EQ(autoValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoValue.getKeyword(), CSSKeyword::Auto);

  auto autoCapsValue =
      parseCSSComponentValue<CSSWideKeyword, CSSKeyword>("AuTO");
  EXPECT_EQ(autoCapsValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoCapsValue.getKeyword(), CSSKeyword::Auto);

  auto autoDisallowedValue = parseCSSComponentValue<CSSWideKeyword>("auto");
  EXPECT_EQ(autoDisallowedValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(autoDisallowedValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto whitespaceValue =
      parseCSSComponentValue<CSSWideKeyword, CSSKeyword>(" flex-start   ");
  EXPECT_EQ(whitespaceValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(whitespaceValue.getKeyword(), CSSKeyword::FlexStart);

  auto badIdentValue =
      parseCSSComponentValue<CSSWideKeyword, CSSKeyword>("bad");
  EXPECT_EQ(badIdentValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(badIdentValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto pxValue = parseCSSComponentValue<CSSWideKeyword>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(pxValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto multiValue = parseCSSComponentValue<CSSWideKeyword>("auto flex-start");
  EXPECT_EQ(multiValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(multiValue.getCSSWideKeyword(), CSSWideKeyword::Unset);
}

TEST(CSSParser, length_values) {
  auto emptyValue = parseCSSComponentValue<CSSWideKeyword, CSSLength>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto autoValue =
      parseCSSComponentValue<CSSWideKeyword, CSSKeyword, CSSLength>("auto");
  EXPECT_EQ(autoValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoValue.getKeyword(), CSSKeyword::Auto);

  auto pxValue = parseCSSComponentValue<CSSWideKeyword, CSSLength>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::Length);
  EXPECT_EQ(pxValue.getLength().value, 20.0f);
  EXPECT_EQ(pxValue.getLength().unit, CSSLengthUnit::Px);

  auto cmValue = parseCSSComponentValue<CSSWideKeyword, CSSLength>("453cm");
  EXPECT_EQ(cmValue.type(), CSSValueType::Length);
  EXPECT_EQ(cmValue.getLength().value, 453.0f);
  EXPECT_EQ(cmValue.getLength().unit, CSSLengthUnit::Cm);

  auto unitlessZeroValue =
      parseCSSComponentValue<CSSWideKeyword, CSSLength>("0");
  EXPECT_EQ(unitlessZeroValue.type(), CSSValueType::Length);
  EXPECT_EQ(unitlessZeroValue.getLength().value, 0.0f);
  EXPECT_EQ(unitlessZeroValue.getLength().unit, CSSLengthUnit::Px);

  auto unitlessNonzeroValue =
      parseCSSComponentValue<CSSWideKeyword, CSSLength>("123");
  EXPECT_EQ(unitlessNonzeroValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(unitlessNonzeroValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto pctValue = parseCSSComponentValue<CSSWideKeyword, CSSLength>("-40%");
  EXPECT_EQ(pctValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(pctValue.getCSSWideKeyword(), CSSWideKeyword::Unset);
}

TEST(CSSParser, length_percentage_values) {
  auto emptyValue =
      parseCSSComponentValue<CSSWideKeyword, CSSLength, CSSPercentage>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto autoValue = parseCSSComponentValue<
      CSSWideKeyword,
      CSSKeyword,
      CSSLength,
      CSSPercentage>("auto");
  EXPECT_EQ(autoValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoValue.getKeyword(), CSSKeyword::Auto);

  auto pxValue =
      parseCSSComponentValue<CSSWideKeyword, CSSLength, CSSPercentage>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::Length);
  EXPECT_EQ(pxValue.getLength().value, 20.0f);
  EXPECT_EQ(pxValue.getLength().unit, CSSLengthUnit::Px);

  auto pctValue =
      parseCSSComponentValue<CSSWideKeyword, CSSLength, CSSPercentage>("-40%");
  EXPECT_EQ(pctValue.type(), CSSValueType::Percentage);
  EXPECT_EQ(pctValue.getPercentage().value, -40.0f);
}

TEST(CSSParser, number_values) {
  auto emptyValue = parseCSSComponentValue<CSSWideKeyword, CSSNumber>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto inheritValue =
      parseCSSComponentValue<CSSWideKeyword, CSSNumber>("inherit");
  EXPECT_EQ(inheritValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(inheritValue.getCSSWideKeyword(), CSSWideKeyword::Inherit);

  auto pxValue =
      parseCSSComponentValue<CSSWideKeyword, CSSKeyword, CSSNumber>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(pxValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto numberValue =
      parseCSSComponentValue<CSSWideKeyword, CSSKeyword, CSSNumber>("123.456");
  EXPECT_EQ(numberValue.type(), CSSValueType::Number);
  EXPECT_EQ(numberValue.getNumber().value, 123.456f);

  auto unitlessZeroValue =
      parseCSSComponentValue<CSSWideKeyword, CSSLength, CSSNumber>("0");
  EXPECT_EQ(unitlessZeroValue.type(), CSSValueType::Number);
  EXPECT_EQ(unitlessZeroValue.getNumber().value, 0.0f);
}

TEST(CSSParser, ratio_values) {
  auto emptyValue = parseCSSComponentValue<CSSWideKeyword, CSSRatio>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto validRatio = parseCSSComponentValue<CSSWideKeyword, CSSRatio>("16/9");
  EXPECT_EQ(validRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(validRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(validRatio.getRatio().denominator, 9.0f);

  auto validRatioWithWhitespace =
      parseCSSComponentValue<CSSWideKeyword, CSSRatio>("16 / 9");
  EXPECT_EQ(validRatioWithWhitespace.type(), CSSValueType::Ratio);
  EXPECT_EQ(validRatioWithWhitespace.getRatio().numerator, 16.0f);
  EXPECT_EQ(validRatioWithWhitespace.getRatio().denominator, 9.0f);

  auto singleNumberRatio =
      parseCSSComponentValue<CSSWideKeyword, CSSRatio>("16");
  EXPECT_EQ(singleNumberRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(singleNumberRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(singleNumberRatio.getRatio().denominator, 1.0f);

  auto fractionalNumber =
      parseCSSComponentValue<CSSWideKeyword, CSSRatio>("16.5");
  EXPECT_EQ(fractionalNumber.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalNumber.getRatio().numerator, 16.5f);
  EXPECT_EQ(fractionalNumber.getRatio().denominator, 1.0f);

  auto negativeNumber = parseCSSComponentValue<CSSWideKeyword, CSSRatio>("-16");
  EXPECT_EQ(negativeNumber.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(negativeNumber.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto missingDenominator =
      parseCSSComponentValue<CSSWideKeyword, CSSRatio>("16/");
  EXPECT_EQ(missingDenominator.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(missingDenominator.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto negativeNumerator =
      parseCSSComponentValue<CSSWideKeyword, CSSRatio>("-16/9");
  EXPECT_EQ(negativeNumerator.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(negativeNumerator.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto negativeDenominator =
      parseCSSComponentValue<CSSWideKeyword, CSSRatio>("16/-9");
  EXPECT_EQ(negativeDenominator.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(negativeDenominator.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto fractionalNumerator =
      parseCSSComponentValue<CSSWideKeyword, CSSRatio>("16.5/9");
  EXPECT_EQ(fractionalNumerator.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalNumerator.getRatio().numerator, 16.5f);
  EXPECT_EQ(fractionalNumerator.getRatio().denominator, 9.0f);

  auto fractionalDenominator =
      parseCSSComponentValue<CSSWideKeyword, CSSRatio>("16/9.5");
  EXPECT_EQ(fractionalDenominator.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalDenominator.getRatio().numerator, 16.0f);
  EXPECT_EQ(fractionalDenominator.getRatio().denominator, 9.5f);

  auto degenerateRatio = parseCSSComponentValue<CSSWideKeyword, CSSRatio>("0");
  EXPECT_EQ(degenerateRatio.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(degenerateRatio.getCSSWideKeyword(), CSSWideKeyword::Unset);
}

TEST(CSSParser, number_ratio_values) {
  auto emptyValue =
      parseCSSComponentValue<CSSWideKeyword, CSSNumber, CSSRatio>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(emptyValue.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto validRatio =
      parseCSSComponentValue<CSSWideKeyword, CSSNumber, CSSRatio>("16/9");
  EXPECT_EQ(validRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(validRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(validRatio.getRatio().denominator, 9.0f);

  auto validRatioWithWhitespace =
      parseCSSComponentValue<CSSWideKeyword, CSSNumber, CSSRatio>("16 / 9");
  EXPECT_EQ(validRatioWithWhitespace.type(), CSSValueType::Ratio);
  EXPECT_EQ(validRatioWithWhitespace.getRatio().numerator, 16.0f);
  EXPECT_EQ(validRatioWithWhitespace.getRatio().denominator, 9.0f);

  auto singleNumberRatio =
      parseCSSComponentValue<CSSWideKeyword, CSSNumber, CSSRatio>("16");
  EXPECT_EQ(singleNumberRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(singleNumberRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(singleNumberRatio.getRatio().denominator, 1.0f);

  auto fractionalNumber =
      parseCSSComponentValue<CSSWideKeyword, CSSNumber, CSSRatio>("16.5");
  EXPECT_EQ(fractionalNumber.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalNumber.getRatio().numerator, 16.5f);
  EXPECT_EQ(singleNumberRatio.getRatio().denominator, 1.0f);

  auto negativeNumber =
      parseCSSComponentValue<CSSWideKeyword, CSSNumber, CSSRatio>("-16");
  EXPECT_EQ(negativeNumber.type(), CSSValueType::Number);
  EXPECT_EQ(negativeNumber.getNumber().value, -16.0f);

  auto missingDenominator =
      parseCSSComponentValue<CSSWideKeyword, CSSNumber, CSSRatio>("16/");
  EXPECT_EQ(missingDenominator.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(missingDenominator.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto negativeNumerator =
      parseCSSComponentValue<CSSWideKeyword, CSSNumber, CSSRatio>("-16/9");
  EXPECT_EQ(negativeNumerator.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(negativeNumerator.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto negativeDenominator =
      parseCSSComponentValue<CSSWideKeyword, CSSNumber, CSSRatio>("16/-9");
  EXPECT_EQ(negativeDenominator.type(), CSSValueType::CSSWideKeyword);
  EXPECT_EQ(negativeDenominator.getCSSWideKeyword(), CSSWideKeyword::Unset);

  auto fractionalNumerator =
      parseCSSComponentValue<CSSWideKeyword, CSSNumber, CSSRatio>("16.5/9");
  EXPECT_EQ(fractionalNumerator.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalNumerator.getRatio().numerator, 16.5f);
  EXPECT_EQ(fractionalNumerator.getRatio().denominator, 9.0f);

  auto fractionalDenominator =
      parseCSSComponentValue<CSSWideKeyword, CSSNumber, CSSRatio>("16/9.5");
  EXPECT_EQ(fractionalDenominator.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalDenominator.getRatio().numerator, 16.0f);
  EXPECT_EQ(fractionalDenominator.getRatio().denominator, 9.5f);

  auto degenerateRatio =
      parseCSSComponentValue<CSSWideKeyword, CSSNumber, CSSRatio>("0");
  EXPECT_EQ(degenerateRatio.type(), CSSValueType::Number);
  EXPECT_EQ(degenerateRatio.getNumber().value, 0.0f);
}

TEST(CSSParser, parse_prop) {
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
  EXPECT_EQ(
      autoWidthValue.getKeyword(), CSSAllowedKeywords<CSSProp::Width>::Auto);

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

TEST(CSSParser, parse_keyword_prop_constexpr) {
  constexpr auto rowValue = parseCSSProp<CSSProp::FlexDirection>("row");
  EXPECT_EQ(rowValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(
      rowValue.getKeyword(), CSSAllowedKeywords<CSSProp::FlexDirection>::Row);
}

TEST(CSSParser, parse_length_prop_constexpr) {
  constexpr auto pxValue = parseCSSProp<CSSProp::BorderWidth>("2px");
  EXPECT_EQ(pxValue.type(), CSSValueType::Length);
  EXPECT_EQ(pxValue.getLength().value, 2.0f);
  EXPECT_EQ(pxValue.getLength().unit, CSSLengthUnit::Px);
}

} // namespace facebook::react
