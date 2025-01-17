/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSAngle.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSAngle, angle_values) {
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

} // namespace facebook::react
