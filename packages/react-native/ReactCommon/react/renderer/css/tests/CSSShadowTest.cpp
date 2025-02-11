/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSList.h>
#include <react/renderer/css/CSSShadow.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSShadow, basic) {
  auto value = parseCSSProperty<CSSShadow>("10px 5px");
  EXPECT_TRUE(std::holds_alternative<CSSShadow>(value));
  auto& shadow = std::get<CSSShadow>(value);

  EXPECT_EQ(shadow.offsetX.value, 10.0f);
  EXPECT_EQ(shadow.offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.offsetY.value, 5.0f);
  EXPECT_EQ(shadow.offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.blurRadius.value, 0.0f);
  EXPECT_EQ(shadow.blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.spreadDistance.value, 0.0f);
  EXPECT_EQ(shadow.spreadDistance.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.color, CSSColor::black());
  EXPECT_FALSE(shadow.inset);
}

TEST(CSSShadow, rem_unit) {
  auto value = parseCSSProperty<CSSShadow>("10px 5rem");
  EXPECT_TRUE(std::holds_alternative<CSSShadow>(value));
  auto& shadow = std::get<CSSShadow>(value);

  EXPECT_EQ(shadow.offsetX.value, 10.0f);
  EXPECT_EQ(shadow.offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.offsetY.value, 5.0f);
  EXPECT_EQ(shadow.offsetY.unit, CSSLengthUnit::Rem);
  EXPECT_EQ(shadow.blurRadius.value, 0.0f);
  EXPECT_EQ(shadow.blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.spreadDistance.value, 0.0f);
  EXPECT_EQ(shadow.spreadDistance.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.color, CSSColor::black());
  EXPECT_FALSE(shadow.inset);
}

TEST(CSSShadow, unitless_zero_length) {
  auto value = parseCSSProperty<CSSShadow>("10px 0");
  EXPECT_TRUE(std::holds_alternative<CSSShadow>(value));
  auto& shadow = std::get<CSSShadow>(value);

  EXPECT_EQ(shadow.offsetX.value, 10.0f);
  EXPECT_EQ(shadow.offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.offsetY.value, 0.0f);
  EXPECT_EQ(shadow.offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.blurRadius.value, 0.0f);
  EXPECT_EQ(shadow.blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.spreadDistance.value, 0.0f);
  EXPECT_EQ(shadow.spreadDistance.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.color, CSSColor::black());
  EXPECT_FALSE(shadow.inset);
}

TEST(CSSShadow, multiple_whitespace) {
  auto value = parseCSSProperty<CSSShadow>("10px  5px");
  EXPECT_TRUE(std::holds_alternative<CSSShadow>(value));
  auto& shadow = std::get<CSSShadow>(value);

  EXPECT_EQ(shadow.offsetX.value, 10.0f);
  EXPECT_EQ(shadow.offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.offsetY.value, 5.0f);
  EXPECT_EQ(shadow.offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.blurRadius.value, 0.0f);
  EXPECT_EQ(shadow.blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.spreadDistance.value, 0.0f);
  EXPECT_EQ(shadow.spreadDistance.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.color, CSSColor::black());
  EXPECT_FALSE(shadow.inset);
}

TEST(CSSShadow, trailing_color) {
  auto value = parseCSSProperty<CSSShadow>("10px 5px red");
  EXPECT_TRUE(std::holds_alternative<CSSShadow>(value));
  auto& shadow = std::get<CSSShadow>(value);

  EXPECT_EQ(shadow.offsetX.value, 10.0f);
  EXPECT_EQ(shadow.offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.offsetY.value, 5.0f);
  EXPECT_EQ(shadow.offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.blurRadius.value, 0.0f);
  EXPECT_EQ(shadow.blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.spreadDistance.value, 0.0f);
  EXPECT_EQ(shadow.spreadDistance.unit, CSSLengthUnit::Px);

  CSSColor red{255u, 0u, 0u, 255u};
  EXPECT_EQ(shadow.color, red);
  EXPECT_FALSE(shadow.inset);
}

TEST(CSSShadow, leading_color) {
  auto value = parseCSSProperty<CSSShadow>("red 10px 5px");
  EXPECT_TRUE(std::holds_alternative<CSSShadow>(value));
  auto& shadow = std::get<CSSShadow>(value);

  EXPECT_EQ(shadow.offsetX.value, 10.0f);
  EXPECT_EQ(shadow.offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.offsetY.value, 5.0f);
  EXPECT_EQ(shadow.offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.blurRadius.value, 0.0f);
  EXPECT_EQ(shadow.blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.spreadDistance.value, 0.0f);
  EXPECT_EQ(shadow.spreadDistance.unit, CSSLengthUnit::Px);

  CSSColor red{255u, 0u, 0u, 255u};
  EXPECT_EQ(shadow.color, red);
  EXPECT_FALSE(shadow.inset);
}

TEST(CSSShadow, color_function) {
  auto value = parseCSSProperty<CSSShadow>("10px 5px rgba(255, 0, 0, 0.5)");
  EXPECT_TRUE(std::holds_alternative<CSSShadow>(value));
  auto& shadow = std::get<CSSShadow>(value);

  EXPECT_EQ(shadow.offsetX.value, 10.0f);
  EXPECT_EQ(shadow.offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.offsetY.value, 5.0f);
  EXPECT_EQ(shadow.offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.blurRadius.value, 0.0f);
  EXPECT_EQ(shadow.blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.spreadDistance.value, 0.0f);
  EXPECT_EQ(shadow.spreadDistance.unit, CSSLengthUnit::Px);

  CSSColor red{255u, 0u, 0u, 128u};
  EXPECT_EQ(shadow.color, red);
  EXPECT_FALSE(shadow.inset);
}

TEST(CSSShadow, blur_radius) {
  auto value = parseCSSProperty<CSSShadow>("10px 5px 2px");
  EXPECT_TRUE(std::holds_alternative<CSSShadow>(value));
  auto& shadow = std::get<CSSShadow>(value);

  EXPECT_EQ(shadow.offsetX.value, 10.0f);
  EXPECT_EQ(shadow.offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.offsetY.value, 5.0f);
  EXPECT_EQ(shadow.offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.blurRadius.value, 2.0f);
  EXPECT_EQ(shadow.blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.spreadDistance.value, 0.0f);
  EXPECT_EQ(shadow.spreadDistance.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.color, CSSColor::black());
  EXPECT_FALSE(shadow.inset);
}

TEST(CSSShadow, spread_distance) {
  auto value = parseCSSProperty<CSSShadow>("10px 5px 2px 3px");
  EXPECT_TRUE(std::holds_alternative<CSSShadow>(value));
  auto& shadow = std::get<CSSShadow>(value);

  EXPECT_EQ(shadow.offsetX.value, 10.0f);
  EXPECT_EQ(shadow.offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.offsetY.value, 5.0f);
  EXPECT_EQ(shadow.offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.blurRadius.value, 2.0f);
  EXPECT_EQ(shadow.blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.spreadDistance.value, 3.0f);
  EXPECT_EQ(shadow.spreadDistance.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.color, CSSColor::black());
  EXPECT_FALSE(shadow.inset);
}

TEST(CSSShadow, inset) {
  auto value = parseCSSProperty<CSSShadow>("5px 2px inset");
  EXPECT_TRUE(std::holds_alternative<CSSShadow>(value));
  auto& shadow = std::get<CSSShadow>(value);

  EXPECT_EQ(shadow.offsetX.value, 5.0f);
  EXPECT_EQ(shadow.offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.offsetY.value, 2.0f);
  EXPECT_EQ(shadow.offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.blurRadius.value, 0.0f);
  EXPECT_EQ(shadow.blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.spreadDistance.value, 0.0f);
  EXPECT_EQ(shadow.spreadDistance.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.color, CSSColor::black());
  EXPECT_TRUE(shadow.inset);
}

TEST(CSShadow, color_length_inset) {
  auto value = parseCSSProperty<CSSShadow>("red 10px 10px inset");
  EXPECT_TRUE(std::holds_alternative<CSSShadow>(value));
  auto& shadow = std::get<CSSShadow>(value);

  EXPECT_EQ(shadow.offsetX.value, 10.0f);
  EXPECT_EQ(shadow.offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.offsetY.value, 10.0f);
  EXPECT_EQ(shadow.offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.blurRadius.value, 0.0f);
  EXPECT_EQ(shadow.blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadow.spreadDistance.value, 0.0f);
  EXPECT_EQ(shadow.spreadDistance.unit, CSSLengthUnit::Px);

  CSSColor red{255u, 0u, 0u, 255u};
  EXPECT_EQ(shadow.color, red);
  EXPECT_TRUE(shadow.inset);
}

TEST(CSSShadow, multiple_shadows) {
  auto value = parseCSSProperty<CSSShadowList>(
      "10px 5px red, 5px 12px inset, inset 10px 45px 13px red");
  EXPECT_TRUE(std::holds_alternative<CSSShadowList>(value));
  auto& shadows = std::get<CSSShadowList>(value);

  EXPECT_EQ(shadows.size(), 3);

  EXPECT_EQ(shadows[0].offsetX.value, 10.0f);
  EXPECT_EQ(shadows[0].offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[0].offsetY.value, 5.0f);
  EXPECT_EQ(shadows[0].offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[0].blurRadius.value, 0.0f);
  EXPECT_EQ(shadows[0].blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[0].spreadDistance.value, 0.0f);
  EXPECT_EQ(shadows[0].spreadDistance.unit, CSSLengthUnit::Px);

  CSSColor red{255u, 0u, 0u, 255u};
  EXPECT_EQ(shadows[0].color, red);
  EXPECT_FALSE(shadows[0].inset);

  EXPECT_EQ(shadows[1].offsetX.value, 5.0f);
  EXPECT_EQ(shadows[1].offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[1].offsetY.value, 12.0f);
  EXPECT_EQ(shadows[1].offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[1].blurRadius.value, 0.0f);
  EXPECT_EQ(shadows[1].blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[1].spreadDistance.value, 0.0f);
  EXPECT_EQ(shadows[1].spreadDistance.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[1].color, CSSColor::black());
  EXPECT_TRUE(shadows[1].inset);

  EXPECT_EQ(shadows[2].offsetX.value, 10.0f);
  EXPECT_EQ(shadows[2].offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[2].offsetY.value, 45.0f);
  EXPECT_EQ(shadows[2].offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[2].blurRadius.value, 13.0f);
  EXPECT_EQ(shadows[2].blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[2].spreadDistance.value, 0.0f);
  EXPECT_EQ(shadows[2].spreadDistance.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[2].color, red);
  EXPECT_TRUE(shadows[2].inset);
}

TEST(CSSShadow, multiple_shadows_with_new_line) {
  auto value = parseCSSProperty<CSSShadowList>(
      "10px 5px red, \n5px 12px inset,\n inset 10px 45px 13px red");
  EXPECT_TRUE(std::holds_alternative<CSSShadowList>(value));
  auto& shadows = std::get<CSSShadowList>(value);

  EXPECT_EQ(shadows.size(), 3);

  EXPECT_EQ(shadows[0].offsetX.value, 10.0f);
  EXPECT_EQ(shadows[0].offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[0].offsetY.value, 5.0f);
  EXPECT_EQ(shadows[0].offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[0].blurRadius.value, 0.0f);
  EXPECT_EQ(shadows[0].blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[0].spreadDistance.value, 0.0f);
  EXPECT_EQ(shadows[0].spreadDistance.unit, CSSLengthUnit::Px);

  CSSColor red{255u, 0u, 0u, 255u};
  EXPECT_EQ(shadows[0].color, red);
  EXPECT_FALSE(shadows[0].inset);

  EXPECT_EQ(shadows[1].offsetX.value, 5.0f);
  EXPECT_EQ(shadows[1].offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[1].offsetY.value, 12.0f);
  EXPECT_EQ(shadows[1].offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[1].blurRadius.value, 0.0f);
  EXPECT_EQ(shadows[1].blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[1].spreadDistance.value, 0.0f);
  EXPECT_EQ(shadows[1].spreadDistance.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[1].color, CSSColor::black());
  EXPECT_TRUE(shadows[1].inset);

  EXPECT_EQ(shadows[2].offsetX.value, 10.0f);
  EXPECT_EQ(shadows[2].offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[2].offsetY.value, 45.0f);
  EXPECT_EQ(shadows[2].offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[2].blurRadius.value, 13.0f);
  EXPECT_EQ(shadows[2].blurRadius.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[2].spreadDistance.value, 0.0f);
  EXPECT_EQ(shadows[2].spreadDistance.unit, CSSLengthUnit::Px);
  EXPECT_EQ(shadows[2].color, red);
  EXPECT_TRUE(shadows[2].inset);
}

TEST(CSSShadow, invalid_units) {
  auto value = parseCSSProperty<CSSShadow>("red 10em 5$ 2| 3rp");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSShadow, too_many_lengths) {
  auto value = parseCSSProperty<CSSShadow>("10px 5px 2px 3px 10px 10px");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSShadow, too_many_lengths_as_part_of_multiple) {
  auto value =
      parseCSSProperty<CSSShadowList>("10px 5px 2px 3px 10px 10px, 10px 5px");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSShadow, inset_between_lengths) {
  auto value = parseCSSProperty<CSSShadow>("10px inset 5px");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSShadow, color_between_lengths) {
  auto value = parseCSSProperty<CSSShadow>("10px blue 5px");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSShadow, invalid_keyword) {
  auto value = parseCSSProperty<CSSShadow>("10px 5px outset");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSShadow, negative_blur) {
  auto value = parseCSSProperty<CSSShadow>("red 5px 2px -3px");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSShadow, missing_unit) {
  auto value = parseCSSProperty<CSSShadow>("10px 5");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

} // namespace facebook::react
