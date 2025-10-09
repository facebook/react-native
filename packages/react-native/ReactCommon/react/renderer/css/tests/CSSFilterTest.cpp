/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSFilter.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSFilter, blur) {
  auto value = parseCSSProperty<CSSFilterFunction>("blur(10px)");
  EXPECT_TRUE(std::holds_alternative<CSSBlurFilter>(value));
  EXPECT_EQ(std::get<CSSBlurFilter>(value).amount.value, 10.0f);
  EXPECT_EQ(std::get<CSSBlurFilter>(value).amount.unit, CSSLengthUnit::Px);
}

TEST(CSSFilter, blur_funky) {
  auto value = parseCSSProperty<CSSFilterFunction>("bLUr( 10px  )");
  EXPECT_TRUE(std::holds_alternative<CSSBlurFilter>(value));
  EXPECT_EQ(std::get<CSSBlurFilter>(value).amount.value, 10.0f);
  EXPECT_EQ(std::get<CSSBlurFilter>(value).amount.unit, CSSLengthUnit::Px);
}

TEST(CSSFilter, blur_default) {
  auto value = parseCSSProperty<CSSFilterFunction>("blur()");
  EXPECT_TRUE(std::holds_alternative<CSSBlurFilter>(value));
  EXPECT_EQ(std::get<CSSBlurFilter>(value).amount.value, 0.0f);
  EXPECT_EQ(std::get<CSSBlurFilter>(value).amount.unit, CSSLengthUnit::Px);
}

TEST(CSSFilter, blur_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("blur(10)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, brightness_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("brightness(10)");
  EXPECT_TRUE(std::holds_alternative<CSSBrightnessFilter>(value));
  EXPECT_EQ(std::get<CSSBrightnessFilter>(value).amount, 10.0f);
}

TEST(CSSFilter, brightness_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("brightness(10%)");
  EXPECT_TRUE(std::holds_alternative<CSSBrightnessFilter>(value));
  EXPECT_EQ(std::get<CSSBrightnessFilter>(value).amount, 0.1f);
}

TEST(CSSFilter, brightness_funky) {
  auto value = parseCSSProperty<CSSFilterFunction>("brightneSS( 10% )");
  EXPECT_TRUE(std::holds_alternative<CSSBrightnessFilter>(value));
  EXPECT_EQ(std::get<CSSBrightnessFilter>(value).amount, 0.1f);
}

TEST(CSSFilter, brightness_default) {
  auto value = parseCSSProperty<CSSFilterFunction>("brightness()");
  EXPECT_TRUE(std::holds_alternative<CSSBrightnessFilter>(value));
  EXPECT_EQ(std::get<CSSBrightnessFilter>(value).amount, 1.0f);
}

TEST(CSSFilter, brightness_negative_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("brightness(-10)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, brightness_negative_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("brightness(-10%)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, bightness_length) {
  auto value = parseCSSProperty<CSSFilterFunction>("brightness(10px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, contrast_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("contrast(10)");
  EXPECT_TRUE(std::holds_alternative<CSSContrastFilter>(value));
  EXPECT_EQ(std::get<CSSContrastFilter>(value).amount, 10.0f);
}

TEST(CSSFilter, contrast_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("contrast(10%)");
  EXPECT_TRUE(std::holds_alternative<CSSContrastFilter>(value));
  EXPECT_EQ(std::get<CSSContrastFilter>(value).amount, 0.1f);
}

TEST(CSSFilter, contrast_funky) {
  auto value = parseCSSProperty<CSSFilterFunction>("contrast( 10% )");
  EXPECT_TRUE(std::holds_alternative<CSSContrastFilter>(value));
  EXPECT_EQ(std::get<CSSContrastFilter>(value).amount, 0.1f);
}

TEST(CSSFilter, contrast_default) {
  auto value = parseCSSProperty<CSSFilterFunction>("contrast()");
  EXPECT_TRUE(std::holds_alternative<CSSContrastFilter>(value));
  EXPECT_EQ(std::get<CSSContrastFilter>(value).amount, 1.0f);
}

TEST(CSSFilter, contrast_negative_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("contrast(-10)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, contrast_negative_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("contrast(-10%)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, contrast_length) {
  auto value = parseCSSProperty<CSSFilterFunction>("contrast(10px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, drop_shadow_no_blur) {
  auto value = parseCSSProperty<CSSFilterFunction>("drop-shadow(10px 5px)");
  EXPECT_TRUE(std::holds_alternative<CSSDropShadowFilter>(value));
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetX.value, 10.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetY.value, 5.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).standardDeviation.value, 0.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).standardDeviation.unit,
      CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).color, CSSColor::black());
}

TEST(CSSFilter, drop_shadow_no_blur_negative_offset) {
  auto value = parseCSSProperty<CSSFilterFunction>("drop-shadow(10px -5em)");
  EXPECT_TRUE(std::holds_alternative<CSSDropShadowFilter>(value));
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetX.value, 10.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetY.value, -5.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetY.unit, CSSLengthUnit::Em);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).standardDeviation.value, 0.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).standardDeviation.unit,
      CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).color, CSSColor::black());
}

TEST(CSSFilter, drop_shadow_no_blur_funky) {
  auto value = parseCSSProperty<CSSFilterFunction>("drop-Shadow( 10px 5px )");
  EXPECT_TRUE(std::holds_alternative<CSSDropShadowFilter>(value));
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetX.value, 10.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetY.value, 5.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).standardDeviation.value, 0.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).standardDeviation.unit,
      CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).color, CSSColor::black());
}

TEST(CSSFilter, drop_shadow_no_blur_pre_color) {
  auto value = parseCSSProperty<CSSFilterFunction>("drop-shadow(red 10px 5px)");
  EXPECT_TRUE(std::holds_alternative<CSSDropShadowFilter>(value));
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetX.value, 10.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetY.value, 5.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).standardDeviation.value, 0.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).standardDeviation.unit,
      CSSLengthUnit::Px);

  CSSColor red{.r = 255, .g = 0, .b = 0, .a = 255};
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).color, red);
}

TEST(CSSFilter, drop_shadow_no_blur_post_color) {
  auto value =
      parseCSSProperty<CSSFilterFunction>("drop-shadow( 10px 5px red )");
  EXPECT_TRUE(std::holds_alternative<CSSDropShadowFilter>(value));
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetX.value, 10.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetY.value, 5.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).standardDeviation.value, 0.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).standardDeviation.unit,
      CSSLengthUnit::Px);
  CSSColor red{.r = 255, .g = 0, .b = 0, .a = 255};

  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).color, red);
}

TEST(CSSFilter, drop_shadow_with_blur) {
  auto value = parseCSSProperty<CSSFilterFunction>("drop-shadow(10px 5px 3px)");
  EXPECT_TRUE(std::holds_alternative<CSSDropShadowFilter>(value));
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetX.value, 10.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetY.value, 5.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).standardDeviation.value, 3.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).standardDeviation.unit,
      CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).color, CSSColor::black());
}

TEST(CSSFilter, drop_shadow_with_blur_pre_color) {
  auto value =
      parseCSSProperty<CSSFilterFunction>("drop-shadow(red 10px 5px 3px )");
  EXPECT_TRUE(std::holds_alternative<CSSDropShadowFilter>(value));
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetX.value, 10.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetY.value, 5.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).standardDeviation.value, 3.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).standardDeviation.unit,
      CSSLengthUnit::Px);

  CSSColor red{.r = 255, .g = 0, .b = 0, .a = 255};
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).color, red);
}

TEST(CSSFilter, drop_shadow_with_blur_post_color) {
  auto value =
      parseCSSProperty<CSSFilterFunction>("drop-shadow( 10px 5px 3px red )");
  EXPECT_TRUE(std::holds_alternative<CSSDropShadowFilter>(value));
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetX.value, 10.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).offsetY.value, 5.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).standardDeviation.value, 3.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(value).standardDeviation.unit,
      CSSLengthUnit::Px);

  CSSColor red{.r = 255, .g = 0, .b = 0, .a = 255};
  EXPECT_EQ(std::get<CSSDropShadowFilter>(value).color, red);
}

TEST(CSSFilter, drop_shadow_number_first) {
  auto value = parseCSSProperty<CSSFilterFunction>("drop-shadow(10 5px 3px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, drop_shadow_with_blur_negative) {
  auto value =
      parseCSSProperty<CSSFilterFunction>("drop-shadow(10px 5px -3px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, drop_shadow_missing_length) {
  auto value = parseCSSProperty<CSSFilterFunction>("drop-shadow(10px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, drop_shadow_extra_length) {
  auto value =
      parseCSSProperty<CSSFilterFunction>("drop-shadow(10px 5px 3px 4px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, drop_shadow_duplicate_colors) {
  auto value =
      parseCSSProperty<CSSFilterFunction>("drop-shadow(red 10px 5px red)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, grayscale_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("grayscale(10)");
  EXPECT_TRUE(std::holds_alternative<CSSGrayscaleFilter>(value));
  EXPECT_EQ(std::get<CSSGrayscaleFilter>(value).amount, 10.0f);
}

TEST(CSSFilter, grayscale_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("grayscale(10%)");
  EXPECT_TRUE(std::holds_alternative<CSSGrayscaleFilter>(value));
  EXPECT_EQ(std::get<CSSGrayscaleFilter>(value).amount, 0.1f);
}

TEST(CSSFilter, grayscale_funky) {
  auto value = parseCSSProperty<CSSFilterFunction>("grayscale( 10% )");
  EXPECT_TRUE(std::holds_alternative<CSSGrayscaleFilter>(value));
  EXPECT_EQ(std::get<CSSGrayscaleFilter>(value).amount, 0.1f);
}

TEST(CSSFilter, grayscale_default) {
  auto value = parseCSSProperty<CSSFilterFunction>("grayscale()");
  EXPECT_TRUE(std::holds_alternative<CSSGrayscaleFilter>(value));
  EXPECT_EQ(std::get<CSSGrayscaleFilter>(value).amount, 1.0f);
}

TEST(CSSFilter, grayscale_negative_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("grayscale(-10)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, grayscale_negative_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("grayscale(-10%)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, grayscale_length) {
  auto value = parseCSSProperty<CSSFilterFunction>("grayscale(10px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, hue_rotate_degrees) {
  auto value = parseCSSProperty<CSSFilterFunction>("hue-rotate(10deg)");
  EXPECT_TRUE(std::holds_alternative<CSSHueRotateFilter>(value));
  EXPECT_EQ(std::get<CSSHueRotateFilter>(value).degrees, 10.0f);
}

TEST(CSSFilter, hue_rotate_turn) {
  auto value = parseCSSProperty<CSSFilterFunction>("hue-rotate(0.5turn)");
  EXPECT_TRUE(std::holds_alternative<CSSHueRotateFilter>(value));
  EXPECT_EQ(std::get<CSSHueRotateFilter>(value).degrees, 180.0f);
}

TEST(CSSFilter, hue_rotate_zero) {
  auto value = parseCSSProperty<CSSFilterFunction>("hue-rotate(0)");
  EXPECT_TRUE(std::holds_alternative<CSSHueRotateFilter>(value));
  EXPECT_EQ(std::get<CSSHueRotateFilter>(value).degrees, 0.0f);
}

TEST(CSSFilter, hue_rotate_negative) {
  auto value = parseCSSProperty<CSSFilterFunction>("hue-rotate(-10deg)");
  EXPECT_TRUE(std::holds_alternative<CSSHueRotateFilter>(value));
  EXPECT_EQ(std::get<CSSHueRotateFilter>(value).degrees, -10.0f);
}

TEST(CSSFilter, hue_rotate_default) {
  auto value = parseCSSProperty<CSSFilterFunction>("hue-rotate()");
  EXPECT_TRUE(std::holds_alternative<CSSHueRotateFilter>(value));
  EXPECT_EQ(std::get<CSSHueRotateFilter>(value).degrees, 0.0f);
}

TEST(CSSFilter, hue_rotate_funky) {
  auto value = parseCSSProperty<CSSFilterFunction>("Hue-Rotate( 10deg )");
  EXPECT_TRUE(std::holds_alternative<CSSHueRotateFilter>(value));
  EXPECT_EQ(std::get<CSSHueRotateFilter>(value).degrees, 10.0f);
}

TEST(CSSFilter, hue_rotate_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("hue-rotate(10%)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, hue_rotate_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("hue-rotate(10)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, invert_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("invert(10)");
  EXPECT_TRUE(std::holds_alternative<CSSInvertFilter>(value));
  EXPECT_EQ(std::get<CSSInvertFilter>(value).amount, 10.0f);
}

TEST(CSSFilter, invert_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("invert(10%)");
  EXPECT_TRUE(std::holds_alternative<CSSInvertFilter>(value));
  EXPECT_EQ(std::get<CSSInvertFilter>(value).amount, 0.1f);
}

TEST(CSSFilter, invert_funky) {
  auto value = parseCSSProperty<CSSFilterFunction>("inVert( 10% )");
  EXPECT_TRUE(std::holds_alternative<CSSInvertFilter>(value));
  EXPECT_EQ(std::get<CSSInvertFilter>(value).amount, 0.1f);
}

TEST(CSSFilter, invert_default) {
  auto value = parseCSSProperty<CSSFilterFunction>("invert()");
  EXPECT_TRUE(std::holds_alternative<CSSInvertFilter>(value));
  EXPECT_EQ(std::get<CSSInvertFilter>(value).amount, 1.0f);
}

TEST(CSSFilter, invert_negative_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("invert(-10)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, invert_negative_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("invert(-10%)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, invert_length) {
  auto value = parseCSSProperty<CSSFilterFunction>("invert(10px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, opacity_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("opacity(10)");
  EXPECT_TRUE(std::holds_alternative<CSSOpacityFilter>(value));
  EXPECT_EQ(std::get<CSSOpacityFilter>(value).amount, 10.0f);
}

TEST(CSSFilter, opacity_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("opacity(10%)");
  EXPECT_TRUE(std::holds_alternative<CSSOpacityFilter>(value));
  EXPECT_EQ(std::get<CSSOpacityFilter>(value).amount, 0.1f);
}

TEST(CSSFilter, opacity_funky) {
  auto value = parseCSSProperty<CSSFilterFunction>("oPAcity( 10% )");
  EXPECT_TRUE(std::holds_alternative<CSSOpacityFilter>(value));
  EXPECT_EQ(std::get<CSSOpacityFilter>(value).amount, 0.1f);
}

TEST(CSSFilter, opacity_default) {
  auto value = parseCSSProperty<CSSFilterFunction>("opacity()");
  EXPECT_TRUE(std::holds_alternative<CSSOpacityFilter>(value));
  EXPECT_EQ(std::get<CSSOpacityFilter>(value).amount, 1.0f);
}

TEST(CSSFilter, opacity_negative_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("opacity(-10)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, opacity_negative_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("opacity(-10%)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, opacity_length) {
  auto value = parseCSSProperty<CSSFilterFunction>("opacity(10px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, saturate_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("saturate(10)");
  EXPECT_TRUE(std::holds_alternative<CSSSaturateFilter>(value));
  EXPECT_EQ(std::get<CSSSaturateFilter>(value).amount, 10.0f);
}

TEST(CSSFilter, saturate_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("saturate(10%)");
  EXPECT_TRUE(std::holds_alternative<CSSSaturateFilter>(value));
  EXPECT_EQ(std::get<CSSSaturateFilter>(value).amount, 0.1f);
}

TEST(CSSFilter, saturate_funky) {
  auto value = parseCSSProperty<CSSFilterFunction>("saturATE( 10% )");
  EXPECT_TRUE(std::holds_alternative<CSSSaturateFilter>(value));
  EXPECT_EQ(std::get<CSSSaturateFilter>(value).amount, 0.1f);
}

TEST(CSSFilter, saturate_default) {
  auto value = parseCSSProperty<CSSFilterFunction>("saturate()");
  EXPECT_TRUE(std::holds_alternative<CSSSaturateFilter>(value));
  EXPECT_EQ(std::get<CSSSaturateFilter>(value).amount, 1.0f);
}

TEST(CSSFilter, saturate_negative_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("saturate(-10)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, saturate_negative_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("saturate(-10%)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, saturate_length) {
  auto value = parseCSSProperty<CSSFilterFunction>("saturate(10px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, sepia_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("sepia(10)");
  EXPECT_TRUE(std::holds_alternative<CSSSepiaFilter>(value));
  EXPECT_EQ(std::get<CSSSepiaFilter>(value).amount, 10.0f);
}

TEST(CSSFilter, sepia_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("sepia(10%)");
  EXPECT_TRUE(std::holds_alternative<CSSSepiaFilter>(value));
  EXPECT_EQ(std::get<CSSSepiaFilter>(value).amount, 0.1f);
}

TEST(CSSFilter, sepia_funky) {
  auto value = parseCSSProperty<CSSFilterFunction>("sepia( 10% )");
  EXPECT_TRUE(std::holds_alternative<CSSSepiaFilter>(value));
  EXPECT_EQ(std::get<CSSSepiaFilter>(value).amount, 0.1f);
}

TEST(CSSFilter, sepia_default) {
  auto value = parseCSSProperty<CSSFilterFunction>("sepia()");
  EXPECT_TRUE(std::holds_alternative<CSSSepiaFilter>(value));
  EXPECT_EQ(std::get<CSSSepiaFilter>(value).amount, 1.0f);
}

TEST(CSSFilter, sepia_negative_number) {
  auto value = parseCSSProperty<CSSFilterFunction>("sepia(-10)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, sepia_negative_percent) {
  auto value = parseCSSProperty<CSSFilterFunction>("sepia(-10%)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, sepia_length) {
  auto value = parseCSSProperty<CSSFilterFunction>("sepia(10px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSFilter, filter_list) {
  auto value = parseCSSProperty<CSSFilterList>(
      "blur(10px) brightness(0.5) drop-shadow(10px 10px 10px red)\t\n drop-shadow(4px -20em)");
  EXPECT_TRUE(std::holds_alternative<CSSFilterList>(value));

  auto list = std::get<CSSFilterList>(value);
  EXPECT_EQ(list.size(), 4);

  EXPECT_TRUE(std::holds_alternative<CSSBlurFilter>(list[0]));
  EXPECT_EQ(std::get<CSSBlurFilter>(list[0]).amount.value, 10.0f);
  EXPECT_EQ(std::get<CSSBlurFilter>(list[0]).amount.unit, CSSLengthUnit::Px);

  EXPECT_TRUE(std::holds_alternative<CSSBrightnessFilter>(list[1]));
  EXPECT_EQ(std::get<CSSBrightnessFilter>(list[1]).amount, 0.5f);

  EXPECT_TRUE(std::holds_alternative<CSSDropShadowFilter>(list[2]));
  EXPECT_EQ(std::get<CSSDropShadowFilter>(list[2]).offsetX.value, 10.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(list[2]).offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(list[2]).offsetY.value, 10.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(list[2]).offsetY.unit, CSSLengthUnit::Px);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(list[2]).standardDeviation.value, 10.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(list[2]).standardDeviation.unit,
      CSSLengthUnit::Px);
  CSSColor red{.r = 255, .g = 0, .b = 0, .a = 255};
  EXPECT_EQ(std::get<CSSDropShadowFilter>(list[2]).color, red);

  EXPECT_TRUE(std::holds_alternative<CSSDropShadowFilter>(list[3]));
  EXPECT_EQ(std::get<CSSDropShadowFilter>(list[3]).offsetX.value, 4.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(list[3]).offsetX.unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(list[3]).offsetY.value, -20.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(list[3]).offsetY.unit, CSSLengthUnit::Em);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(list[3]).standardDeviation.value, 0.0f);
  EXPECT_EQ(
      std::get<CSSDropShadowFilter>(list[3]).standardDeviation.unit,
      CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSDropShadowFilter>(list[3]).color, CSSColor::black());
}

TEST(CSSFilter, filter_list_commas) {
  auto value = parseCSSProperty<CSSFilterList>(
      "blur(10px), brightness(0.5), drop-shadow(10px 10px 10px red), drop-shadow(4px -20em)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

} // namespace facebook::react
