/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/components/view/BoxShadowPropsConversions.h>
#include <react/renderer/components/view/ClipPathPropsConversions.h>
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
  RawValue value{folly::dynamic::array(
      folly::dynamic::object("offsetX", 10)("offsetY", 2)("blurRadius", 3)(
          "spreadDistance", 5)("color", "hello"))};

  std::vector<BoxShadow> boxShadows;
  parseUnprocessedBoxShadow(
      PropsParserContext{-1, ContextContainer{}}, value, boxShadows);

  EXPECT_TRUE(boxShadows.empty());
}

TEST(ConversionsTest, unprocessed_box_object_negative_blur) {
  RawValue value{folly::dynamic::array(
      folly::dynamic::object("offsetX", 10)("offsetY", 2)("blurRadius", -3)(
          "spreadDistance", 5))};

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
  RawValue value{folly::dynamic::array(
      folly::dynamic::object(
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

TEST(ConversionsTest, unprocessed_clip_path_string_inset) {
  std::optional<ClipPath> clipPath;
  parseUnprocessedClipPath("inset(10px 20% 30px 5%)", clipPath);

  ASSERT_TRUE(clipPath.has_value());
  ASSERT_TRUE(clipPath->shape.has_value());
  ASSERT_TRUE(std::holds_alternative<InsetShape>(*clipPath->shape));

  auto inset = std::get<InsetShape>(*clipPath->shape);
  EXPECT_EQ(inset.top.value, 10);
  EXPECT_EQ(inset.top.unit, UnitType::Point);
  EXPECT_EQ(inset.right.value, 20);
  EXPECT_EQ(inset.right.unit, UnitType::Percent);
  EXPECT_EQ(inset.bottom.value, 30);
  EXPECT_EQ(inset.bottom.unit, UnitType::Point);
  EXPECT_EQ(inset.left.value, 5);
  EXPECT_EQ(inset.left.unit, UnitType::Percent);
  EXPECT_FALSE(inset.borderRadius.has_value());
}

TEST(ConversionsTest, unprocessed_clip_path_string_circle) {
  std::optional<ClipPath> clipPath;
  parseUnprocessedClipPath("circle(50% at 25% 75%)", clipPath);

  ASSERT_TRUE(clipPath.has_value());
  ASSERT_TRUE(clipPath->shape.has_value());
  ASSERT_TRUE(std::holds_alternative<CircleShape>(*clipPath->shape));

  auto circle = std::get<CircleShape>(*clipPath->shape);
  EXPECT_EQ(circle.r->value, 50);
  EXPECT_EQ(circle.r->unit, UnitType::Percent);
  ASSERT_TRUE(circle.cx.has_value());
  EXPECT_EQ(circle.cx->value, 25);
  EXPECT_EQ(circle.cx->unit, UnitType::Percent);
  ASSERT_TRUE(circle.cy.has_value());
  EXPECT_EQ(circle.cy->value, 75);
  EXPECT_EQ(circle.cy->unit, UnitType::Percent);
}

TEST(ConversionsTest, unprocessed_clip_path_string_ellipse) {
  std::optional<ClipPath> clipPath;
  parseUnprocessedClipPath("ellipse(100px 50px at 10% 20%)", clipPath);

  ASSERT_TRUE(clipPath.has_value());
  ASSERT_TRUE(clipPath->shape.has_value());
  ASSERT_TRUE(std::holds_alternative<EllipseShape>(*clipPath->shape));

  auto ellipse = std::get<EllipseShape>(*clipPath->shape);
  EXPECT_EQ(ellipse.rx->value, 100);
  EXPECT_EQ(ellipse.rx->unit, UnitType::Point);
  EXPECT_EQ(ellipse.ry->value, 50);
  EXPECT_EQ(ellipse.ry->unit, UnitType::Point);
  ASSERT_TRUE(ellipse.cx.has_value());
  EXPECT_EQ(ellipse.cx->value, 10);
  EXPECT_EQ(ellipse.cx->unit, UnitType::Percent);
  ASSERT_TRUE(ellipse.cy.has_value());
  EXPECT_EQ(ellipse.cy->value, 20);
  EXPECT_EQ(ellipse.cy->unit, UnitType::Percent);
}

TEST(ConversionsTest, unprocessed_clip_path_string_polygon) {
  std::optional<ClipPath> clipPath;
  parseUnprocessedClipPath("polygon(0 0, 100% 0, 50% 100%)", clipPath);

  ASSERT_TRUE(clipPath.has_value());
  ASSERT_TRUE(clipPath->shape.has_value());
  ASSERT_TRUE(std::holds_alternative<PolygonShape>(*clipPath->shape));

  auto polygon = std::get<PolygonShape>(*clipPath->shape);
  ASSERT_EQ(polygon.points.size(), 3);

  EXPECT_EQ(polygon.points[0].first.value, 0);
  EXPECT_EQ(polygon.points[0].first.unit, UnitType::Point);
  EXPECT_EQ(polygon.points[0].second.value, 0);
  EXPECT_EQ(polygon.points[0].second.unit, UnitType::Point);

  EXPECT_EQ(polygon.points[1].first.value, 100);
  EXPECT_EQ(polygon.points[1].first.unit, UnitType::Percent);
  EXPECT_EQ(polygon.points[1].second.value, 0);
  EXPECT_EQ(polygon.points[1].second.unit, UnitType::Point);

  EXPECT_EQ(polygon.points[2].first.value, 50);
  EXPECT_EQ(polygon.points[2].first.unit, UnitType::Percent);
  EXPECT_EQ(polygon.points[2].second.value, 100);
  EXPECT_EQ(polygon.points[2].second.unit, UnitType::Percent);
}

TEST(ConversionsTest, unprocessed_clip_path_string_with_geometry_box) {
  std::optional<ClipPath> clipPath;
  parseUnprocessedClipPath("inset(10px) border-box", clipPath);

  ASSERT_TRUE(clipPath.has_value());
  ASSERT_TRUE(clipPath->shape.has_value());
  ASSERT_TRUE(clipPath->geometryBox.has_value());
  EXPECT_EQ(*clipPath->geometryBox, GeometryBox::BorderBox);
}

TEST(ConversionsTest, processed_clip_path_inset) {
  RawValue value{folly::dynamic::object(
      "shape",
      folly::dynamic::object("type", "inset")("top", 10)("right", "20%")(
          "bottom", 30)("left", "5%"))};

  std::optional<ClipPath> clipPath;
  parseProcessedClipPath(
      PropsParserContext{-1, ContextContainer{}}, value, clipPath);

  ASSERT_TRUE(clipPath.has_value());
  ASSERT_TRUE(clipPath->shape.has_value());
  ASSERT_TRUE(std::holds_alternative<InsetShape>(*clipPath->shape));

  auto inset = std::get<InsetShape>(*clipPath->shape);
  EXPECT_EQ(inset.top.value, 10);
  EXPECT_EQ(inset.top.unit, UnitType::Point);
  EXPECT_EQ(inset.right.value, 20);
  EXPECT_EQ(inset.right.unit, UnitType::Percent);
  EXPECT_EQ(inset.bottom.value, 30);
  EXPECT_EQ(inset.bottom.unit, UnitType::Point);
  EXPECT_EQ(inset.left.value, 5);
  EXPECT_EQ(inset.left.unit, UnitType::Percent);
}

TEST(ConversionsTest, processed_clip_path_circle) {
  RawValue value{folly::dynamic::object(
      "shape",
      folly::dynamic::object("type", "circle")("r", "50%")("cx", "25%")(
          "cy", "75%"))};

  std::optional<ClipPath> clipPath;
  parseProcessedClipPath(
      PropsParserContext{-1, ContextContainer{}}, value, clipPath);

  ASSERT_TRUE(clipPath.has_value());
  ASSERT_TRUE(clipPath->shape.has_value());
  ASSERT_TRUE(std::holds_alternative<CircleShape>(*clipPath->shape));

  auto circle = std::get<CircleShape>(*clipPath->shape);
  EXPECT_EQ(circle.r->value, 50);
  EXPECT_EQ(circle.r->unit, UnitType::Percent);
  ASSERT_TRUE(circle.cx.has_value());
  EXPECT_EQ(circle.cx->value, 25);
  EXPECT_EQ(circle.cx->unit, UnitType::Percent);
  ASSERT_TRUE(circle.cy.has_value());
  EXPECT_EQ(circle.cy->value, 75);
  EXPECT_EQ(circle.cy->unit, UnitType::Percent);
}

TEST(ConversionsTest, processed_clip_path_ellipse) {
  RawValue value{folly::dynamic::object(
      "shape",
      folly::dynamic::object("type", "ellipse")("rx", 100)("ry", 50)(
          "cx", "10%")("cy", "20%"))};

  std::optional<ClipPath> clipPath;
  parseProcessedClipPath(
      PropsParserContext{-1, ContextContainer{}}, value, clipPath);

  ASSERT_TRUE(clipPath.has_value());
  ASSERT_TRUE(clipPath->shape.has_value());
  ASSERT_TRUE(std::holds_alternative<EllipseShape>(*clipPath->shape));

  auto ellipse = std::get<EllipseShape>(*clipPath->shape);
  EXPECT_EQ(ellipse.rx->value, 100);
  EXPECT_EQ(ellipse.rx->unit, UnitType::Point);
  EXPECT_EQ(ellipse.ry->value, 50);
  EXPECT_EQ(ellipse.ry->unit, UnitType::Point);
  ASSERT_TRUE(ellipse.cx.has_value());
  EXPECT_EQ(ellipse.cx->value, 10);
  EXPECT_EQ(ellipse.cx->unit, UnitType::Percent);
  ASSERT_TRUE(ellipse.cy.has_value());
  EXPECT_EQ(ellipse.cy->value, 20);
  EXPECT_EQ(ellipse.cy->unit, UnitType::Percent);
}

TEST(ConversionsTest, processed_clip_path_polygon) {
  RawValue value{folly::dynamic::object(
      "shape",
      folly::dynamic::object("type", "polygon")(
          "points",
          folly::dynamic::array(
              folly::dynamic::object("x", 0)("y", 0),
              folly::dynamic::object("x", "100%")("y", 0),
              folly::dynamic::object("x", "50%")("y", "100%")))(
          "fillRule", "evenodd"))};

  std::optional<ClipPath> clipPath;
  parseProcessedClipPath(
      PropsParserContext{-1, ContextContainer{}}, value, clipPath);

  ASSERT_TRUE(clipPath.has_value());
  ASSERT_TRUE(clipPath->shape.has_value());
  ASSERT_TRUE(std::holds_alternative<PolygonShape>(*clipPath->shape));

  auto polygon = std::get<PolygonShape>(*clipPath->shape);
  ASSERT_EQ(polygon.points.size(), 3);

  EXPECT_EQ(polygon.points[0].first.value, 0);
  EXPECT_EQ(polygon.points[0].first.unit, UnitType::Point);
  EXPECT_EQ(polygon.points[0].second.value, 0);
  EXPECT_EQ(polygon.points[0].second.unit, UnitType::Point);

  EXPECT_EQ(polygon.points[1].first.value, 100);
  EXPECT_EQ(polygon.points[1].first.unit, UnitType::Percent);
  EXPECT_EQ(polygon.points[1].second.value, 0);
  EXPECT_EQ(polygon.points[1].second.unit, UnitType::Point);

  EXPECT_EQ(polygon.points[2].first.value, 50);
  EXPECT_EQ(polygon.points[2].first.unit, UnitType::Percent);
  EXPECT_EQ(polygon.points[2].second.value, 100);
  EXPECT_EQ(polygon.points[2].second.unit, UnitType::Percent);

  ASSERT_TRUE(polygon.fillRule.has_value());
  EXPECT_EQ(*polygon.fillRule, FillRule::EvenOdd);
}

TEST(ConversionsTest, processed_clip_path_rect) {
  RawValue value{folly::dynamic::object(
      "shape",
      folly::dynamic::object("type", "rect")("top", 10)("right", "90%")(
          "bottom", "80%")("left", 5))};

  std::optional<ClipPath> clipPath;
  parseProcessedClipPath(
      PropsParserContext{-1, ContextContainer{}}, value, clipPath);

  ASSERT_TRUE(clipPath.has_value());
  ASSERT_TRUE(clipPath->shape.has_value());
  ASSERT_TRUE(std::holds_alternative<RectShape>(*clipPath->shape));

  auto rect = std::get<RectShape>(*clipPath->shape);
  EXPECT_EQ(rect.top.value, 10);
  EXPECT_EQ(rect.top.unit, UnitType::Point);
  EXPECT_EQ(rect.right.value, 90);
  EXPECT_EQ(rect.right.unit, UnitType::Percent);
  EXPECT_EQ(rect.bottom.value, 80);
  EXPECT_EQ(rect.bottom.unit, UnitType::Percent);
  EXPECT_EQ(rect.left.value, 5);
  EXPECT_EQ(rect.left.unit, UnitType::Point);
}

TEST(ConversionsTest, processed_clip_path_xywh) {
  RawValue value{folly::dynamic::object(
      "shape",
      folly::dynamic::object("type", "xywh")("x", 10)("y", "20%")("width", 100)(
          "height", "50%")("borderRadius", 5))};

  std::optional<ClipPath> clipPath;
  parseProcessedClipPath(
      PropsParserContext{-1, ContextContainer{}}, value, clipPath);

  ASSERT_TRUE(clipPath.has_value());
  ASSERT_TRUE(clipPath->shape.has_value());
  ASSERT_TRUE(std::holds_alternative<XywhShape>(*clipPath->shape));

  auto xywh = std::get<XywhShape>(*clipPath->shape);
  EXPECT_EQ(xywh.x.value, 10);
  EXPECT_EQ(xywh.x.unit, UnitType::Point);
  EXPECT_EQ(xywh.y.value, 20);
  EXPECT_EQ(xywh.y.unit, UnitType::Percent);
  EXPECT_EQ(xywh.width.value, 100);
  EXPECT_EQ(xywh.width.unit, UnitType::Point);
  EXPECT_EQ(xywh.height.value, 50);
  EXPECT_EQ(xywh.height.unit, UnitType::Percent);
  ASSERT_TRUE(xywh.borderRadius.has_value());
  EXPECT_EQ(xywh.borderRadius->value, 5);
  EXPECT_EQ(xywh.borderRadius->unit, UnitType::Point);
}

TEST(ConversionsTest, processed_clip_path_with_geometry_box) {
  RawValue value{folly::dynamic::object(
      "shape", folly::dynamic::object("type", "inset")("top", 10))(
      "geometryBox", "padding-box")};

  std::optional<ClipPath> clipPath;
  parseProcessedClipPath(
      PropsParserContext{-1, ContextContainer{}}, value, clipPath);

  ASSERT_TRUE(clipPath.has_value());
  ASSERT_TRUE(clipPath->shape.has_value());
  ASSERT_TRUE(clipPath->geometryBox.has_value());
  EXPECT_EQ(*clipPath->geometryBox, GeometryBox::PaddingBox);
}

TEST(ConversionsTest, processed_clip_path_invalid_type) {
  RawValue value{folly::dynamic::object(
      "shape", folly::dynamic::object("type", "invalid"))};

  std::optional<ClipPath> clipPath;
  parseProcessedClipPath(
      PropsParserContext{-1, ContextContainer{}}, value, clipPath);

  EXPECT_FALSE(clipPath.has_value());
}

TEST(ConversionsTest, processed_clip_path_missing_shape_type) {
  RawValue value{
      folly::dynamic::object("shape", folly::dynamic::object("top", 10))};

  std::optional<ClipPath> clipPath;
  parseProcessedClipPath(
      PropsParserContext{-1, ContextContainer{}}, value, clipPath);

  EXPECT_FALSE(clipPath.has_value());
}

} // namespace facebook::react
