/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSFontVariant.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSFontVariant, single_variant) {
  auto commonLigatures = parseCSSProperty<CSSFontVariant>("common-ligatures");
  EXPECT_TRUE(std::holds_alternative<CSSFontVariant>(commonLigatures));
  EXPECT_EQ(
      std::get<CSSFontVariant>(commonLigatures),
      CSSFontVariant::CommonLigatures);

  auto stylistic15 = parseCSSProperty<CSSFontVariant>("stylistic-fifteen");
  EXPECT_TRUE(std::holds_alternative<CSSFontVariant>(stylistic15));
  EXPECT_EQ(
      std::get<CSSFontVariant>(stylistic15), CSSFontVariant::StylisticFifteen);

  auto bogus = parseCSSProperty<CSSFontVariant>("inset");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(bogus));
}

TEST(CSSFontVariant, multiple_variants) {
  auto commonLigatures =
      parseCSSProperty<CSSFontVariantList>("common-ligatures");
  EXPECT_TRUE(std::holds_alternative<CSSFontVariantList>(commonLigatures));
  EXPECT_EQ(std::get<CSSFontVariantList>(commonLigatures).size(), 1);
  EXPECT_EQ(
      std::get<CSSFontVariantList>(commonLigatures)[0],
      CSSFontVariant::CommonLigatures);

  auto commonLigaturesAndHistoricalForms =
      parseCSSProperty<CSSFontVariantList>("common-ligatures no-contextual");
  EXPECT_TRUE(
      std::holds_alternative<CSSFontVariantList>(
          commonLigaturesAndHistoricalForms));
  EXPECT_EQ(
      std::get<CSSFontVariantList>(commonLigaturesAndHistoricalForms).size(),
      2);
  EXPECT_EQ(
      std::get<CSSFontVariantList>(commonLigaturesAndHistoricalForms)[0],
      CSSFontVariant::CommonLigatures);
  EXPECT_EQ(
      std::get<CSSFontVariantList>(commonLigaturesAndHistoricalForms)[1],
      CSSFontVariant::NoContextual);

  auto lotsOfWhitespace = parseCSSProperty<CSSFontVariantList>(
      "  no-discretionary-ligatures  \n  proportional-nums\tstylistic-twelve");
  EXPECT_TRUE(std::holds_alternative<CSSFontVariantList>(lotsOfWhitespace));
  EXPECT_EQ(std::get<CSSFontVariantList>(lotsOfWhitespace).size(), 3);
  EXPECT_EQ(
      std::get<CSSFontVariantList>(lotsOfWhitespace)[0],
      CSSFontVariant::NoDiscretionaryLigatures);
  EXPECT_EQ(
      std::get<CSSFontVariantList>(lotsOfWhitespace)[1],
      CSSFontVariant::ProportionalNums);
  EXPECT_EQ(
      std::get<CSSFontVariantList>(lotsOfWhitespace)[2],
      CSSFontVariant::StylisticTwelve);

  auto bogus = parseCSSProperty<CSSFontVariantList>("inset");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(bogus));

  auto commaSeparated =
      parseCSSProperty<CSSFontVariantList>("common-ligatures, stylistic-six");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(commaSeparated));
}

} // namespace facebook::react
