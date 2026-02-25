/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/primitives.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <yoga/YGEnums.h>
#include <yoga/node/Node.h>
#include <cmath>
#include <optional>

namespace facebook::react {

/*
 * Yoga's `float` <-> React Native's `Float` (can be `double` or `float`)
 *
 * Regular Yoga `float` values represent some onscreen-position-related values.
 * They can be real numbers or special value `YGUndefined` (which actually is
 * `NaN`). Conceptually, layout computation process inside Yoga should never
 * produce `NaN` values from non-`NaN` values. At the same time, ` YGUndefined`
 * values have special "no limit" meaning in Yoga, therefore ` YGUndefined`
 * usually corresponds to `Infinity` value.
 */
inline Float floatFromYogaFloat(float value)
{
  static_assert(YGUndefined != YGUndefined, "The code of this function assumes that YGUndefined is NaN.");
  if (std::isnan(value) /* means: `value == YGUndefined` */) {
    return std::numeric_limits<Float>::infinity();
  }

  return (Float)value;
}

inline float yogaFloatFromFloat(Float value)
{
  if (!std::isfinite(value)) {
    return YGUndefined;
  }

  return (float)value;
}

/*
 * `yoga::FloatOptional` <-> React Native's `Float`
 *
 * `yoga::FloatOptional` represents optional dimensionless float values in Yoga
 * Style object (e.g. `flex`). The most suitable analogy to empty
 * `yoga::FloatOptional` is `NaN` value.
 * `yoga::FloatOptional` values are usually parsed from some outside data source
 * which usually has some special corresponding representation for an empty
 * value.
 */
inline Float floatFromYogaOptionalFloat(yoga::FloatOptional value)
{
  if (value.isUndefined()) {
    return std::numeric_limits<Float>::quiet_NaN();
  }

  return floatFromYogaFloat(value.unwrap());
}

inline yoga::FloatOptional yogaOptionalFloatFromFloat(Float value)
{
  if (std::isnan(value)) {
    return yoga::FloatOptional();
  }

  return yoga::FloatOptional((float)value);
}

inline std::optional<Float> optionalFloatFromYogaValue(
    const yoga::Style::Length &length,
    std::optional<Float> base = {})
{
  if (length.isPoints()) {
    return floatFromYogaOptionalFloat(length.value());
  } else if (length.isPercent()) {
    return base.has_value() ? std::optional<Float>(base.value() * floatFromYogaOptionalFloat(length.value()))
                            : std::optional<Float>();
  } else {
    return {};
  }
}

static inline PositionType positionTypeFromYogaPositionType(yoga::PositionType positionType)
{
  switch (positionType) {
    case yoga::PositionType::Static:
      return PositionType::Static;
    case yoga::PositionType::Relative:
      return PositionType::Relative;
    case yoga::PositionType::Absolute:
      return PositionType::Absolute;
  }
}

inline DisplayType displayTypeFromYGDisplay(YGDisplay display)
{
  switch (display) {
    case YGDisplayNone:
      return DisplayType::None;
    case YGDisplayContents:
      return DisplayType::Contents;
    case YGDisplayFlex:
      return DisplayType::Flex;
  }
}

inline LayoutMetrics layoutMetricsFromYogaNode(yoga::Node &yogaNode)
{
  auto layoutMetrics = LayoutMetrics{};

  layoutMetrics.frame = Rect{
      .origin =
          Point{
              .x = floatFromYogaFloat(YGNodeLayoutGetLeft(&yogaNode)),
              .y = floatFromYogaFloat(YGNodeLayoutGetTop(&yogaNode))},
      .size = Size{
          .width = floatFromYogaFloat(YGNodeLayoutGetWidth(&yogaNode)),
          .height = floatFromYogaFloat(YGNodeLayoutGetHeight(&yogaNode))}};

  layoutMetrics.borderWidth = EdgeInsets{
      floatFromYogaFloat(YGNodeLayoutGetBorder(&yogaNode, YGEdgeLeft)),
      floatFromYogaFloat(YGNodeLayoutGetBorder(&yogaNode, YGEdgeTop)),
      floatFromYogaFloat(YGNodeLayoutGetBorder(&yogaNode, YGEdgeRight)),
      floatFromYogaFloat(YGNodeLayoutGetBorder(&yogaNode, YGEdgeBottom))};

  layoutMetrics.contentInsets = EdgeInsets{
      layoutMetrics.borderWidth.left + floatFromYogaFloat(YGNodeLayoutGetPadding(&yogaNode, YGEdgeLeft)),
      layoutMetrics.borderWidth.top + floatFromYogaFloat(YGNodeLayoutGetPadding(&yogaNode, YGEdgeTop)),
      layoutMetrics.borderWidth.right + floatFromYogaFloat(YGNodeLayoutGetPadding(&yogaNode, YGEdgeRight)),
      layoutMetrics.borderWidth.bottom + floatFromYogaFloat(YGNodeLayoutGetPadding(&yogaNode, YGEdgeBottom))};

  layoutMetrics.displayType = displayTypeFromYGDisplay(YGNodeStyleGetDisplay(&yogaNode));

  layoutMetrics.positionType = positionTypeFromYogaPositionType(yogaNode.style().positionType());

  layoutMetrics.layoutDirection = YGNodeLayoutGetDirection(&yogaNode) == YGDirectionRTL ? LayoutDirection::RightToLeft
                                                                                        : LayoutDirection::LeftToRight;

  return layoutMetrics;
}

inline YGDirection yogaDirectionFromLayoutDirection(LayoutDirection direction)
{
  switch (direction) {
    case LayoutDirection::Undefined:
      return YGDirectionInherit;
    case LayoutDirection::LeftToRight:
      return YGDirectionLTR;
    case LayoutDirection::RightToLeft:
      return YGDirectionRTL;
  }
}

} // namespace facebook::react
