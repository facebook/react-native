/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSRatio.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSRatio, ratio_values) {
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

  auto fractionalNumerator = parseCSSProperty<CSSRatio>("16.5/9");
  EXPECT_TRUE(std::holds_alternative<CSSRatio>(fractionalNumerator));
  EXPECT_EQ(std::get<CSSRatio>(fractionalNumerator).numerator, 16.5f);
  EXPECT_EQ(std::get<CSSRatio>(fractionalNumerator).denominator, 9.0f);

  auto fractionalDenominator = parseCSSProperty<CSSRatio>("16/9.5");
  EXPECT_TRUE(std::holds_alternative<CSSRatio>(fractionalDenominator));
  EXPECT_EQ(std::get<CSSRatio>(fractionalDenominator).numerator, 16.0f);
}

TEST(CSSRatio, invalid_values) {
  auto negativeNumber = parseCSSProperty<CSSRatio>("-16");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(negativeNumber));

  auto missingDenominator = parseCSSProperty<CSSRatio>("16/");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(missingDenominator));

  auto negativeNumerator = parseCSSProperty<CSSRatio>("-16/9");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(negativeNumerator));

  auto negativeDenominator = parseCSSProperty<CSSRatio>("16/-9");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(negativeDenominator));
}

TEST(CSSRatio, degenerate_values) {
  auto degenerateRatio = parseCSSProperty<CSSRatio>("0");
  EXPECT_TRUE(std::holds_alternative<CSSRatio>(degenerateRatio));
  EXPECT_TRUE(std::get<CSSRatio>(degenerateRatio).isDegenerate());
}

} // namespace facebook::react
