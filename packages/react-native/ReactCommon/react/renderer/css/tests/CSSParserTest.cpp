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
  auto emptyValue = parseCSSComponentValue<CSSKeyword>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(emptyValue.getKeyword(), CSSKeyword::Unset);

  auto autoValue = parseCSSComponentValue<CSSKeyword>("auto");
  EXPECT_EQ(autoValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoValue.getKeyword(), CSSKeyword::Auto);

  auto autoCapsValue = parseCSSComponentValue<CSSKeyword>("AuTO");
  EXPECT_EQ(autoCapsValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoCapsValue.getKeyword(), CSSKeyword::Auto);

  auto autoDisallowedValue = parseCSSComponentValue<CSSFlexDirection>("auto");
  EXPECT_EQ(autoDisallowedValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoDisallowedValue.getKeyword(), CSSKeyword::Unset);

  auto whitespaceValue =
      parseCSSComponentValue<CSSAlignItems>(" flex-start   ");
  EXPECT_EQ(whitespaceValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(whitespaceValue.getKeyword(), CSSAlignItems::FlexStart);

  auto badIdentValue = parseCSSComponentValue<CSSWideKeyword>("bad");
  EXPECT_EQ(badIdentValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(badIdentValue.getKeyword(), CSSKeyword::Unset);

  auto pxValue = parseCSSComponentValue<CSSKeyword>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(pxValue.getKeyword(), CSSKeyword::Unset);

  auto multiValue = parseCSSComponentValue<CSSKeyword>("auto flex-start");
  EXPECT_EQ(multiValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(multiValue.getKeyword(), CSSKeyword::Unset);
}

TEST(CSSParser, length_values) {
  auto emptyValue = parseCSSComponentValue<CSSAutoKeyword, CSSLength>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(emptyValue.getKeyword(), CSSKeyword::Unset);

  auto autoValue = parseCSSComponentValue<CSSAutoKeyword, CSSLength>("auto");
  EXPECT_EQ(autoValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoValue.getKeyword(), CSSKeyword::Auto);

  auto pxValue = parseCSSComponentValue<CSSAutoKeyword, CSSLength>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::Length);
  EXPECT_EQ(pxValue.getLength().value, 20.0f);
  EXPECT_EQ(pxValue.getLength().unit, CSSLengthUnit::Px);

  auto cmValue = parseCSSComponentValue<CSSAutoKeyword, CSSLength>("453cm");
  EXPECT_EQ(cmValue.type(), CSSValueType::Length);
  EXPECT_EQ(cmValue.getLength().value, 453.0f);
  EXPECT_EQ(cmValue.getLength().unit, CSSLengthUnit::Cm);

  auto unitlessZeroValue =
      parseCSSComponentValue<CSSAutoKeyword, CSSLength>("0");
  EXPECT_EQ(unitlessZeroValue.type(), CSSValueType::Length);
  EXPECT_EQ(unitlessZeroValue.getLength().value, 0.0f);
  EXPECT_EQ(unitlessZeroValue.getLength().unit, CSSLengthUnit::Px);

  auto unitlessNonzeroValue =
      parseCSSComponentValue<CSSAutoKeyword, CSSLength>("123");
  EXPECT_EQ(unitlessNonzeroValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(unitlessNonzeroValue.getKeyword(), CSSKeyword::Unset);

  auto pctValue = parseCSSComponentValue<CSSAutoKeyword, CSSLength>("-40%");
  EXPECT_EQ(pctValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(pctValue.getKeyword(), CSSKeyword::Unset);
}

TEST(CSSParser, length_percentage_values) {
  auto emptyValue =
      parseCSSComponentValue<CSSAutoKeyword, CSSLength, CSSPercentage>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(emptyValue.getKeyword(), CSSKeyword::Unset);

  auto autoValue =
      parseCSSComponentValue<CSSAutoKeyword, CSSLength, CSSPercentage>("auto");
  EXPECT_EQ(autoValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(autoValue.getKeyword(), CSSKeyword::Auto);

  auto pxValue =
      parseCSSComponentValue<CSSAutoKeyword, CSSLength, CSSPercentage>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::Length);
  EXPECT_EQ(pxValue.getLength().value, 20.0f);
  EXPECT_EQ(pxValue.getLength().unit, CSSLengthUnit::Px);

  auto pctValue =
      parseCSSComponentValue<CSSAutoKeyword, CSSLength, CSSPercentage>("-40%");
  EXPECT_EQ(pctValue.type(), CSSValueType::Percentage);
  EXPECT_EQ(pctValue.getPercentage().value, -40.0f);
}

TEST(CSSParser, number_values) {
  auto emptyValue = parseCSSComponentValue<CSSKeyword, CSSNumber>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(emptyValue.getKeyword(), CSSKeyword::Unset);

  auto inheritValue = parseCSSComponentValue<CSSKeyword, CSSNumber>("inherit");
  EXPECT_EQ(inheritValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(inheritValue.getKeyword(), CSSKeyword::Inherit);

  auto pxValue = parseCSSComponentValue<CSSKeyword, CSSNumber>("20px");
  EXPECT_EQ(pxValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(pxValue.getKeyword(), CSSKeyword::Unset);

  auto numberValue = parseCSSComponentValue<CSSKeyword, CSSNumber>("123.456");
  EXPECT_EQ(numberValue.type(), CSSValueType::Number);
  EXPECT_EQ(numberValue.getNumber().value, 123.456f);

  auto unitlessZeroValue =
      parseCSSComponentValue<CSSAutoKeyword, CSSLength, CSSNumber>("0");
  EXPECT_EQ(unitlessZeroValue.type(), CSSValueType::Number);
  EXPECT_EQ(unitlessZeroValue.getNumber().value, 0.0f);
}

TEST(CSSParser, ratio_values) {
  auto emptyValue = parseCSSComponentValue<CSSKeyword, CSSRatio>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(emptyValue.getKeyword(), CSSKeyword::Unset);

  auto validRatio = parseCSSComponentValue<CSSKeyword, CSSRatio>("16/9");
  EXPECT_EQ(validRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(validRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(validRatio.getRatio().denominator, 9.0f);

  auto validRatioWithWhitespace =
      parseCSSComponentValue<CSSKeyword, CSSRatio>("16 / 9");
  EXPECT_EQ(validRatioWithWhitespace.type(), CSSValueType::Ratio);
  EXPECT_EQ(validRatioWithWhitespace.getRatio().numerator, 16.0f);
  EXPECT_EQ(validRatioWithWhitespace.getRatio().denominator, 9.0f);

  auto singleNumberRatio = parseCSSComponentValue<CSSKeyword, CSSRatio>("16");
  EXPECT_EQ(singleNumberRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(singleNumberRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(singleNumberRatio.getRatio().denominator, 1.0f);

  auto fractionalNumber = parseCSSComponentValue<CSSKeyword, CSSRatio>("16.5");
  EXPECT_EQ(fractionalNumber.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalNumber.getRatio().numerator, 16.5f);
  EXPECT_EQ(fractionalNumber.getRatio().denominator, 1.0f);

  auto negativeNumber = parseCSSComponentValue<CSSKeyword, CSSRatio>("-16");
  EXPECT_EQ(negativeNumber.type(), CSSValueType::Keyword);
  EXPECT_EQ(negativeNumber.getKeyword(), CSSKeyword::Unset);

  auto missingDenominator = parseCSSComponentValue<CSSKeyword, CSSRatio>("16/");
  EXPECT_EQ(missingDenominator.type(), CSSValueType::Keyword);
  EXPECT_EQ(missingDenominator.getKeyword(), CSSKeyword::Unset);

  auto negativeNumerator =
      parseCSSComponentValue<CSSKeyword, CSSRatio>("-16/9");
  EXPECT_EQ(negativeNumerator.type(), CSSValueType::Keyword);
  EXPECT_EQ(negativeNumerator.getKeyword(), CSSKeyword::Unset);

  auto negativeDenominator =
      parseCSSComponentValue<CSSKeyword, CSSRatio>("16/-9");
  EXPECT_EQ(negativeDenominator.type(), CSSValueType::Keyword);
  EXPECT_EQ(negativeDenominator.getKeyword(), CSSKeyword::Unset);

  auto fractionalNumerator =
      parseCSSComponentValue<CSSKeyword, CSSRatio>("16.5/9");
  EXPECT_EQ(fractionalNumerator.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalNumerator.getRatio().numerator, 16.5f);
  EXPECT_EQ(fractionalNumerator.getRatio().denominator, 9.0f);

  auto fractionalDenominator =
      parseCSSComponentValue<CSSKeyword, CSSRatio>("16/9.5");
  EXPECT_EQ(fractionalDenominator.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalDenominator.getRatio().numerator, 16.0f);
  EXPECT_EQ(fractionalDenominator.getRatio().denominator, 9.5f);

  auto degenerateRatio = parseCSSComponentValue<CSSKeyword, CSSRatio>("0");
  EXPECT_EQ(degenerateRatio.type(), CSSValueType::Keyword);
  EXPECT_EQ(degenerateRatio.getKeyword(), CSSKeyword::Unset);
}

TEST(CSSParser, number_ratio_values) {
  auto emptyValue = parseCSSComponentValue<CSSKeyword, CSSNumber, CSSRatio>("");
  EXPECT_EQ(emptyValue.type(), CSSValueType::Keyword);
  EXPECT_EQ(emptyValue.getKeyword(), CSSKeyword::Unset);

  auto validRatio =
      parseCSSComponentValue<CSSKeyword, CSSNumber, CSSRatio>("16/9");
  EXPECT_EQ(validRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(validRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(validRatio.getRatio().denominator, 9.0f);

  auto validRatioWithWhitespace =
      parseCSSComponentValue<CSSKeyword, CSSNumber, CSSRatio>("16 / 9");
  EXPECT_EQ(validRatioWithWhitespace.type(), CSSValueType::Ratio);
  EXPECT_EQ(validRatioWithWhitespace.getRatio().numerator, 16.0f);
  EXPECT_EQ(validRatioWithWhitespace.getRatio().denominator, 9.0f);

  auto singleNumberRatio =
      parseCSSComponentValue<CSSKeyword, CSSNumber, CSSRatio>("16");
  EXPECT_EQ(singleNumberRatio.type(), CSSValueType::Ratio);
  EXPECT_EQ(singleNumberRatio.getRatio().numerator, 16.0f);
  EXPECT_EQ(singleNumberRatio.getRatio().denominator, 1.0f);

  auto fractionalNumber =
      parseCSSComponentValue<CSSKeyword, CSSNumber, CSSRatio>("16.5");
  EXPECT_EQ(fractionalNumber.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalNumber.getRatio().numerator, 16.5f);
  EXPECT_EQ(singleNumberRatio.getRatio().denominator, 1.0f);

  auto negativeNumber =
      parseCSSComponentValue<CSSKeyword, CSSNumber, CSSRatio>("-16");
  EXPECT_EQ(negativeNumber.type(), CSSValueType::Number);
  EXPECT_EQ(negativeNumber.getNumber().value, -16.0f);

  auto missingDenominator =
      parseCSSComponentValue<CSSKeyword, CSSNumber, CSSRatio>("16/");
  EXPECT_EQ(missingDenominator.type(), CSSValueType::Keyword);
  EXPECT_EQ(missingDenominator.getKeyword(), CSSKeyword::Unset);

  auto negativeNumerator =
      parseCSSComponentValue<CSSKeyword, CSSNumber, CSSRatio>("-16/9");
  EXPECT_EQ(negativeNumerator.type(), CSSValueType::Keyword);
  EXPECT_EQ(negativeNumerator.getKeyword(), CSSKeyword::Unset);

  auto negativeDenominator =
      parseCSSComponentValue<CSSKeyword, CSSNumber, CSSRatio>("16/-9");
  EXPECT_EQ(negativeDenominator.type(), CSSValueType::Keyword);
  EXPECT_EQ(negativeDenominator.getKeyword(), CSSKeyword::Unset);

  auto fractionalNumerator =
      parseCSSComponentValue<CSSKeyword, CSSNumber, CSSRatio>("16.5/9");
  EXPECT_EQ(fractionalNumerator.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalNumerator.getRatio().numerator, 16.5f);
  EXPECT_EQ(fractionalNumerator.getRatio().denominator, 9.0f);

  auto fractionalDenominator =
      parseCSSComponentValue<CSSKeyword, CSSNumber, CSSRatio>("16/9.5");
  EXPECT_EQ(fractionalDenominator.type(), CSSValueType::Ratio);
  EXPECT_EQ(fractionalDenominator.getRatio().numerator, 16.0f);
  EXPECT_EQ(fractionalDenominator.getRatio().denominator, 9.5f);

  auto degenerateRatio =
      parseCSSComponentValue<CSSKeyword, CSSNumber, CSSRatio>("0");
  EXPECT_EQ(degenerateRatio.type(), CSSValueType::Number);
  EXPECT_EQ(degenerateRatio.getNumber().value, 0.0f);
}

} // namespace facebook::react
