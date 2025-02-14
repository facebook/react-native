/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/components/view/BoxShadowPropsConversions.h>
#include <react/renderer/components/view/FilterPropsConversions.h>

namespace facebook::react {

TEST(ConversionsTest, unprocessed_box_shadow_string) {
  RawValue value{
      folly::dynamic("10px 2px 0 5px #fff, inset 20px 10px 5px 0 #000")};

  std::vector<BoxShadow> boxShadows;
  parseUnprocessedBoxShadow(
      PropsParserContext{-1, ContextContainer{}}, value, boxShadows);

  EXPECT_EQ(boxShadows.size(), 2);
  EXPECT_EQ(boxShadows[0].offsetX, 10);
  EXPECT_EQ(boxShadows[0].offsetY, 2);
  EXPECT_EQ(boxShadows[0].blurRadius, 0);
  EXPECT_EQ(boxShadows[0].spreadDistance, 5);
  EXPECT_EQ(boxShadows[0].color, colorFromRGBA(255, 255, 255, 255));
  EXPECT_FALSE(boxShadows[0].inset);

  EXPECT_EQ(boxShadows[1].offsetX, 20);
  EXPECT_EQ(boxShadows[1].offsetY, 10);
  EXPECT_EQ(boxShadows[1].blurRadius, 5);
  EXPECT_EQ(boxShadows[1].spreadDistance, 0);
  EXPECT_EQ(boxShadows[1].color, colorFromRGBA(0, 0, 0, 255));
  EXPECT_TRUE(boxShadows[1].inset);
}

TEST(ConversionsTest, unprocessed_box_shadow_objects) {
  RawValue value{folly::dynamic::array(
      folly::dynamic::object("offsetX", 10)("offsetY", 2)("blurRadius", 3)(
          "spreadDistance", 5),
      folly::dynamic::object("offsetX", 20)("offsetY", 10)("spreadDistance", 2)(
          "color", "#fff")("inset", true))};

  std::vector<BoxShadow> boxShadows;
  parseUnprocessedBoxShadow(
      PropsParserContext{-1, ContextContainer{}}, value, boxShadows);

  EXPECT_EQ(boxShadows.size(), 2);
  EXPECT_EQ(boxShadows[0].offsetX, 10);
  EXPECT_EQ(boxShadows[0].offsetY, 2);
  EXPECT_EQ(boxShadows[0].blurRadius, 3);
  EXPECT_EQ(boxShadows[0].spreadDistance, 5);
  EXPECT_EQ(boxShadows[0].color, SharedColor{});
  EXPECT_FALSE(boxShadows[0].inset);

  EXPECT_EQ(boxShadows[1].offsetX, 20);
  EXPECT_EQ(boxShadows[1].offsetY, 10);
  EXPECT_EQ(boxShadows[1].blurRadius, 0);
  EXPECT_EQ(boxShadows[1].spreadDistance, 2);
  EXPECT_EQ(boxShadows[1].color, colorFromRGBA(255, 255, 255, 255));
  EXPECT_TRUE(boxShadows[1].inset);
}

TEST(ConversionsTest, unprocessed_box_object_invalid_color) {
  RawValue value{folly::dynamic::array(folly::dynamic::object("offsetX", 10)(
      "offsetY", 2)("blurRadius", 3)("spreadDistance", 5)("color", "hello"))};

  std::vector<BoxShadow> boxShadows;
  parseUnprocessedBoxShadow(
      PropsParserContext{-1, ContextContainer{}}, value, boxShadows);

  EXPECT_TRUE(boxShadows.empty());
}

TEST(ConversionsTest, unprocessed_box_object_negative_blur) {
  RawValue value{folly::dynamic::array(folly::dynamic::object("offsetX", 10)(
      "offsetY", 2)("blurRadius", -3)("spreadDistance", 5))};

  std::vector<BoxShadow> boxShadows;
  parseUnprocessedBoxShadow(
      PropsParserContext{-1, ContextContainer{}}, value, boxShadows);

  EXPECT_TRUE(boxShadows.empty());
}

TEST(ConversionsTest, unprocessed_filter_string) {
  RawValue value{folly::dynamic(
      "drop-shadow(10px -2px 0.5px #fff) blur(5px) hue-rotate(90deg) saturate(2) brightness(50%)")};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_EQ(filters.size(), 5);

  EXPECT_EQ(filters[0].type, FilterType::DropShadow);
  EXPECT_TRUE(std::holds_alternative<DropShadowParams>(filters[0].parameters));
  EXPECT_EQ(std::get<DropShadowParams>(filters[0].parameters).offsetX, 10);
  EXPECT_EQ(std::get<DropShadowParams>(filters[0].parameters).offsetY, -2);
  EXPECT_EQ(
      std::get<DropShadowParams>(filters[0].parameters).standardDeviation, 0.5);
  EXPECT_EQ(
      std::get<DropShadowParams>(filters[0].parameters).color,
      colorFromRGBA(255, 255, 255, 255));

  EXPECT_EQ(filters[1].type, FilterType::Blur);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[1].parameters));
  EXPECT_EQ(std::get<Float>(filters[1].parameters), 5.0f);

  EXPECT_EQ(filters[2].type, FilterType::HueRotate);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[2].parameters));
  EXPECT_EQ(std::get<Float>(filters[2].parameters), 90.0f);

  EXPECT_EQ(filters[3].type, FilterType::Saturate);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[3].parameters));
  EXPECT_EQ(std::get<Float>(filters[3].parameters), 2.0f);

  EXPECT_EQ(filters[4].type, FilterType::Brightness);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[4].parameters));
  EXPECT_EQ(std::get<Float>(filters[4].parameters), 0.5f);
}

TEST(ConversionsTest, unprocessed_filter_objects) {
  RawValue value{folly::dynamic::array(
      folly::dynamic::object(
          "drop-shadow",
          folly::dynamic::object("offsetX", 10)("offsetY", "-2px")(
              "standardDeviation", 0.5)),
      folly::dynamic::object("drop-shadow", "2px 0 0.5px #fff"),
      folly::dynamic::object("blur", 5),
      folly::dynamic::object("hue-rotate", "90deg"),
      folly::dynamic::object("saturate", 2),
      folly::dynamic::object("brightness", "50%"))};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_EQ(filters.size(), 6);

  EXPECT_EQ(filters[0].type, FilterType::DropShadow);
  EXPECT_TRUE(std::holds_alternative<DropShadowParams>(filters[0].parameters));
  EXPECT_EQ(std::get<DropShadowParams>(filters[0].parameters).offsetX, 10);
  EXPECT_EQ(std::get<DropShadowParams>(filters[0].parameters).offsetY, -2);
  EXPECT_EQ(
      std::get<DropShadowParams>(filters[0].parameters).standardDeviation, 0.5);
  EXPECT_EQ(
      std::get<DropShadowParams>(filters[0].parameters).color, SharedColor{});

  EXPECT_EQ(filters[1].type, FilterType::DropShadow);
  EXPECT_TRUE(std::holds_alternative<DropShadowParams>(filters[1].parameters));
  EXPECT_EQ(std::get<DropShadowParams>(filters[1].parameters).offsetX, 2);
  EXPECT_EQ(std::get<DropShadowParams>(filters[1].parameters).offsetY, 0);
  EXPECT_EQ(
      std::get<DropShadowParams>(filters[1].parameters).standardDeviation, 0.5);
  EXPECT_EQ(
      std::get<DropShadowParams>(filters[1].parameters).color,
      colorFromRGBA(255, 255, 255, 255));

  EXPECT_EQ(filters[2].type, FilterType::Blur);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[2].parameters));
  EXPECT_EQ(std::get<Float>(filters[2].parameters), 5.0f);

  EXPECT_EQ(filters[3].type, FilterType::HueRotate);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[3].parameters));
  EXPECT_EQ(std::get<Float>(filters[3].parameters), 90.0f);

  EXPECT_EQ(filters[4].type, FilterType::Saturate);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[4].parameters));
  EXPECT_EQ(std::get<Float>(filters[4].parameters), 2.0f);

  EXPECT_EQ(filters[5].type, FilterType::Brightness);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[5].parameters));
  EXPECT_EQ(std::get<Float>(filters[5].parameters), 0.5f);
}

TEST(ConversionsTest, unprocessed_filter_objects_negative_shadow_blur) {
  RawValue value{folly::dynamic::array(folly::dynamic::object(
      "drop-shadow",
      folly::dynamic::object("offsetX", 10)("offsetY", "-2px")(
          "standardDeviation", -0.5)))};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_TRUE(filters.empty());
}

TEST(ConversionsTest, unprocessed_filter_objects_negative_blur) {
  RawValue value{folly::dynamic::array(folly::dynamic::object("blur", -5))};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_TRUE(filters.empty());
}

TEST(ConversionsTest, unprocessed_filter_objects_negative_contrast) {
  RawValue value{
      folly::dynamic::array(folly::dynamic::object("constrast", -5))};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_TRUE(filters.empty());
}

TEST(ConversionsTest, unprocessed_filter_objects_negative_hue_rotate) {
  RawValue value{
      folly::dynamic::array(folly::dynamic::object("hue-rotate", -5))};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_EQ(filters.size(), 1);

  EXPECT_EQ(filters[0].type, FilterType::HueRotate);
  EXPECT_TRUE(std::holds_alternative<Float>(filters[0].parameters));
  EXPECT_EQ(std::get<Float>(filters[0].parameters), -5.0f);
}

TEST(ConversionsTest, unprocessed_filter_objects_multiple_objects) {
  RawValue value{folly::dynamic::array(
      folly::dynamic::object("blur", 5)("hue-rotate", "90deg"))};

  std::vector<FilterFunction> filters;
  parseUnprocessedFilter(
      PropsParserContext{-1, ContextContainer{}}, value, filters);

  EXPECT_TRUE(filters.empty());
}

} // namespace facebook::react
