/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSLengthPercentage, length_percentage_values) {
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

} // namespace facebook::react
