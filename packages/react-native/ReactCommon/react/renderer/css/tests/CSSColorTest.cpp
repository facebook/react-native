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

} // namespace facebook::react
