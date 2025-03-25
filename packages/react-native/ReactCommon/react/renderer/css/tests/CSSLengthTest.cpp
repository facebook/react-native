/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSLength, length_values) {
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

  auto negativeValue = parseCSSProperty<CSSLength>("-20em");
  EXPECT_TRUE(std::holds_alternative<CSSLength>(negativeValue));
  EXPECT_EQ(std::get<CSSLength>(negativeValue).value, -20.0f);
  EXPECT_EQ(std::get<CSSLength>(negativeValue).unit, CSSLengthUnit::Em);
}

TEST(CSSLength, parse_constexpr) {
  [[maybe_unused]] constexpr auto pxValue = parseCSSProperty<CSSLength>("2px");
}

} // namespace facebook::react
