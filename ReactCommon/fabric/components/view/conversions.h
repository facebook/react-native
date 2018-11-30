/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Conv.h>
#include <folly/dynamic.h>
#include <react/components/view/primitives.h>
#include <react/core/LayoutMetrics.h>
#include <react/graphics/Geometry.h>
#include <yoga/YGNode.h>
#include <yoga/Yoga.h>
#include <cmath>

namespace facebook {
namespace react {

inline Float floatFromYogaFloat(float value) {
  if (value == YGUndefined) {
    return kFloatUndefined;
  }

  return (Float)value;
}

inline float yogaFloatFromFloat(Float value) {
  if (value == kFloatUndefined) {
    return YGUndefined;
  }

  return (float)value;
}

inline Float floatFromYogaOptionalFloat(YGFloatOptional value) {
  if (value.isUndefined()) {
    return kFloatUndefined;
  }

  return floatFromYogaFloat(value.getValue());
}

inline YGFloatOptional yogaOptionalFloatFromFloat(Float value) {
  if (value == kFloatUndefined) {
    return YGFloatOptional();
  }

  return YGFloatOptional(yogaFloatFromFloat(value));
}

inline YGValue yogaStyleValueFromFloat(const Float &value) {
  if (std::isnan(value) || value == kFloatUndefined) {
    return YGValueUndefined;
  }

  return {(float)value, YGUnitPoint};
}

inline folly::Optional<Float> optionalFloatFromYogaValue(
    const YGValue &value,
    folly::Optional<Float> base = {}) {
  switch (value.unit) {
    case YGUnitUndefined:
      return {};
    case YGUnitPoint:
      return floatFromYogaFloat(value.value);
    case YGUnitPercent:
      return base.has_value()
          ? folly::Optional<Float>(
                base.value() * floatFromYogaFloat(value.value))
          : folly::Optional<Float>();
    case YGUnitAuto:
      return {};
  }
}

inline LayoutMetrics layoutMetricsFromYogaNode(YGNode &yogaNode) {
  auto layoutMetrics = LayoutMetrics{};

  layoutMetrics.frame =
      Rect{Point{floatFromYogaFloat(YGNodeLayoutGetLeft(&yogaNode)),
                 floatFromYogaFloat(YGNodeLayoutGetTop(&yogaNode))},
           Size{floatFromYogaFloat(YGNodeLayoutGetWidth(&yogaNode)),
                floatFromYogaFloat(YGNodeLayoutGetHeight(&yogaNode))}};

  layoutMetrics.borderWidth = EdgeInsets{
      floatFromYogaFloat(YGNodeLayoutGetBorder(&yogaNode, YGEdgeLeft)),
      floatFromYogaFloat(YGNodeLayoutGetBorder(&yogaNode, YGEdgeTop)),
      floatFromYogaFloat(YGNodeLayoutGetBorder(&yogaNode, YGEdgeRight)),
      floatFromYogaFloat(YGNodeLayoutGetBorder(&yogaNode, YGEdgeBottom))};

  layoutMetrics.contentInsets = EdgeInsets{
      layoutMetrics.borderWidth.left +
          floatFromYogaFloat(YGNodeLayoutGetPadding(&yogaNode, YGEdgeLeft)),
      layoutMetrics.borderWidth.top +
          floatFromYogaFloat(YGNodeLayoutGetPadding(&yogaNode, YGEdgeTop)),
      layoutMetrics.borderWidth.right +
          floatFromYogaFloat(YGNodeLayoutGetPadding(&yogaNode, YGEdgeRight)),
      layoutMetrics.borderWidth.bottom +
          floatFromYogaFloat(YGNodeLayoutGetPadding(&yogaNode, YGEdgeBottom))};

  layoutMetrics.displayType = yogaNode.getStyle().display == YGDisplayNone
      ? DisplayType::None
      : DisplayType::Flex;

  layoutMetrics.layoutDirection =
      YGNodeLayoutGetDirection(&yogaNode) == YGDirectionRTL
      ? LayoutDirection::RightToLeft
      : LayoutDirection::LeftToRight;

  return layoutMetrics;
}

inline YGDirection yogaDirectionFromLayoutDirection(LayoutDirection direction) {
  switch (direction) {
    case LayoutDirection::Undefined:
      return YGDirectionInherit;
    case LayoutDirection::LeftToRight:
      return YGDirectionLTR;
    case LayoutDirection::RightToLeft:
      return YGDirectionRTL;
  }
}

inline void fromDynamic(const folly::dynamic &value, YGDirection &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "inherit") {
    result = YGDirectionInherit;
    return;
  }
  if (stringValue == "ltr") {
    result = YGDirectionLTR;
    return;
  }
  if (stringValue == "rtl") {
    result = YGDirectionRTL;
    return;
  }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, YGFlexDirection &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "column") {
    result = YGFlexDirectionColumn;
    return;
  }
  if (stringValue == "column-reverse") {
    result = YGFlexDirectionColumnReverse;
    return;
  }
  if (stringValue == "row") {
    result = YGFlexDirectionRow;
    return;
  }
  if (stringValue == "row-reverse") {
    result = YGFlexDirectionRowReverse;
    return;
  }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, YGJustify &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "flex-start") {
    result = YGJustifyFlexStart;
    return;
  }
  if (stringValue == "center") {
    result = YGJustifyCenter;
    return;
  }
  if (stringValue == "flex-end") {
    result = YGJustifyFlexEnd;
    return;
  }
  if (stringValue == "space-between") {
    result = YGJustifySpaceBetween;
    return;
  }
  if (stringValue == "space-around") {
    result = YGJustifySpaceAround;
    return;
  }
  if (stringValue == "space-evenly") {
    result = YGJustifySpaceEvenly;
    return;
  }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, YGAlign &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "auto") {
    result = YGAlignAuto;
    return;
  }
  if (stringValue == "flex-start") {
    result = YGAlignFlexStart;
    return;
  }
  if (stringValue == "center") {
    result = YGAlignCenter;
    return;
  }
  if (stringValue == "flex-end") {
    result = YGAlignFlexEnd;
    return;
  }
  if (stringValue == "stretch") {
    result = YGAlignStretch;
    return;
  }
  if (stringValue == "baseline") {
    result = YGAlignBaseline;
    return;
  }
  if (stringValue == "between") {
    result = YGAlignSpaceBetween;
    return;
  }
  if (stringValue == "space-around") {
    result = YGAlignSpaceAround;
    return;
  }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, YGPositionType &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "relative") {
    result = YGPositionTypeRelative;
    return;
  }
  if (stringValue == "absolute") {
    result = YGPositionTypeAbsolute;
    return;
  }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, YGWrap &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "no-wrap") {
    result = YGWrapNoWrap;
    return;
  }
  if (stringValue == "wrap") {
    result = YGWrapWrap;
    return;
  }
  if (stringValue == "wrap-reverse") {
    result = YGWrapWrapReverse;
    return;
  }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, YGOverflow &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "visible") {
    result = YGOverflowVisible;
    return;
  }
  if (stringValue == "hidden") {
    result = YGOverflowHidden;
    return;
  }
  if (stringValue == "scroll") {
    result = YGOverflowScroll;
    return;
  }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, YGDisplay &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "flex") {
    result = YGDisplayFlex;
    return;
  }
  if (stringValue == "none") {
    result = YGDisplayNone;
    return;
  }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, YGValue &result) {
  if (value.isNumber()) {
    result = yogaStyleValueFromFloat(value.asDouble());
    return;
  } else if (value.isString()) {
    const auto stringValue = value.asString();
    if (stringValue == "auto") {
      result = YGValueUndefined;
      return;
    } else {
      if (stringValue.back() == '%') {
        result = {
            folly::to<float>(stringValue.substr(0, stringValue.length() - 1)),
            YGUnitPercent};
        return;
      } else {
        result = {folly::to<float>(stringValue), YGUnitPoint};
        return;
      }
    }
  }
  result = YGValueUndefined;
}

inline void fromDynamic(const folly::dynamic &value, YGFloatOptional &result) {
  if (value.isNumber()) {
    result = YGFloatOptional(value.asDouble());
    return;
  } else if (value.isString()) {
    const auto stringValue = value.asString();
    if (stringValue == "auto") {
      result = YGFloatOptional();
      return;
    }
  }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, Transform &result) {
  assert(value.isArray());
  auto transformMatrix = Transform{};
  for (const auto &tranformConfiguration : value) {
    assert(tranformConfiguration.isObject());
    auto pair = *tranformConfiguration.items().begin();
    const auto &operation = pair.first.asString();
    const auto &parameters = pair.second;

    if (operation == "matrix") {
      assert(parameters.isArray());
      assert(parameters.size() == transformMatrix.matrix.size());
      auto i = 0;
      for (auto item : parameters) {
        transformMatrix.matrix[i++] = (Float)item.asDouble();
      }
    } else if (operation == "perspective") {
      transformMatrix = transformMatrix *
          Transform::Perspective((Float)parameters.asDouble());
    } else if (operation == "rotateX") {
      transformMatrix = transformMatrix *
          Transform::Rotate((Float)parameters.asDouble(), 0, 0);
    } else if (operation == "rotateY") {
      transformMatrix = transformMatrix *
          Transform::Rotate(0, (Float)parameters.asDouble(), 0);
    } else if (operation == "rotateZ") {
      transformMatrix = transformMatrix *
          Transform::Rotate(0, 0, (Float)parameters.asDouble());
    } else if (operation == "scale") {
      transformMatrix = transformMatrix *
          Transform::Scale((Float)parameters.asDouble(),
                           (Float)parameters.asDouble(),
                           (Float)parameters.asDouble());
    } else if (operation == "scaleX") {
      transformMatrix = transformMatrix *
          Transform::Scale((Float)parameters.asDouble(), 0, 0);
    } else if (operation == "scaleY") {
      transformMatrix = transformMatrix *
          Transform::Scale(0, (Float)parameters.asDouble(), 0);
    } else if (operation == "scaleZ") {
      transformMatrix = transformMatrix *
          Transform::Scale(0, 0, (Float)parameters.asDouble());
    } else if (operation == "translate") {
      transformMatrix =
          transformMatrix *
          Transform::Translate(
              parameters[0].asDouble(), parameters[1].asDouble(), 0);
    } else if (operation == "translateX") {
      transformMatrix =
          transformMatrix * Transform::Translate(parameters.asDouble(), 0, 0);
    } else if (operation == "translateY") {
      transformMatrix =
          transformMatrix * Transform::Translate(0, parameters.asDouble(), 0);
    } else if (operation == "skewX") {
      transformMatrix =
          transformMatrix * Transform::Skew(parameters.asDouble(), 0);
    } else if (operation == "skewY") {
      transformMatrix =
          transformMatrix * Transform::Skew(0, parameters.asDouble());
    }
  }

  result = transformMatrix;
}

inline void fromDynamic(
    const folly::dynamic &value,
    PointerEventsMode &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "auto") {
    result = PointerEventsMode::Auto;
    return;
  }
  if (stringValue == "none") {
    result = PointerEventsMode::None;
    return;
  }
  if (stringValue == "box-none") {
    result = PointerEventsMode::BoxNone;
    return;
  }
  if (stringValue == "box-only") {
    result = PointerEventsMode::BoxOnly;
    return;
  }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, BorderStyle &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "solid") {
    result = BorderStyle::Solid;
    return;
  }
  if (stringValue == "dotted") {
    result = BorderStyle::Dotted;
    return;
  }
  if (stringValue == "dashed") {
    result = BorderStyle::Dashed;
    return;
  }
  abort();
}

inline std::string toString(
    const std::array<float, YGDimensionCount> &dimensions) {
  return "{" + folly::to<std::string>(dimensions[0]) + ", " +
      folly::to<std::string>(dimensions[1]) + "}";
}

inline std::string toString(const std::array<float, 4> &position) {
  return "{" + folly::to<std::string>(position[0]) + ", " +
      folly::to<std::string>(position[1]) + "}";
}

inline std::string toString(const std::array<float, YGEdgeCount> &edges) {
  return "{" + folly::to<std::string>(edges[0]) + ", " +
      folly::to<std::string>(edges[1]) + ", " +
      folly::to<std::string>(edges[2]) + ", " +
      folly::to<std::string>(edges[3]) + "}";
}

inline std::string toString(const YGDirection &value) {
  switch (value) {
    case YGDirectionInherit:
      return "inherit";
    case YGDirectionLTR:
      return "ltr";
    case YGDirectionRTL:
      return "rtl";
  }
}

inline std::string toString(const YGFlexDirection &value) {
  switch (value) {
    case YGFlexDirectionColumn:
      return "column";
    case YGFlexDirectionColumnReverse:
      return "column-reverse";
    case YGFlexDirectionRow:
      return "row";
    case YGFlexDirectionRowReverse:
      return "row-reverse";
  }
}

inline std::string toString(const YGJustify &value) {
  switch (value) {
    case YGJustifyFlexStart:
      return "flex-start";
    case YGJustifyCenter:
      return "center";
    case YGJustifyFlexEnd:
      return "flex-end";
    case YGJustifySpaceBetween:
      return "space-between";
    case YGJustifySpaceAround:
      return "space-around";
    case YGJustifySpaceEvenly:
      return "space-evenly";
  }
}

inline std::string toString(const YGAlign &value) {
  switch (value) {
    case YGAlignAuto:
      return "auto";
    case YGAlignFlexStart:
      return "flex-start";
    case YGAlignCenter:
      return "center";
    case YGAlignFlexEnd:
      return "flex-end";
    case YGAlignStretch:
      return "stretch";
    case YGAlignBaseline:
      return "baseline";
    case YGAlignSpaceBetween:
      return "space-between";
    case YGAlignSpaceAround:
      return "space-around";
  }
}

inline std::string toString(const YGPositionType &value) {
  switch (value) {
    case YGPositionTypeRelative:
      return "relative";
    case YGPositionTypeAbsolute:
      return "absolute";
  }
}

inline std::string toString(const YGWrap &value) {
  switch (value) {
    case YGWrapNoWrap:
      return "no-wrap";
    case YGWrapWrap:
      return "wrap";
    case YGWrapWrapReverse:
      return "wrap-reverse";
  }
}

inline std::string toString(const YGOverflow &value) {
  switch (value) {
    case YGOverflowVisible:
      return "visible";
    case YGOverflowScroll:
      return "scroll";
    case YGOverflowHidden:
      return "hidden";
  }
}

inline std::string toString(const YGDisplay &value) {
  switch (value) {
    case YGDisplayFlex:
      return "flex";
    case YGDisplayNone:
      return "none";
  }
}

inline std::string toString(const YGValue &value) {
  switch (value.unit) {
    case YGUnitUndefined:
      return "undefined";
    case YGUnitPoint:
      return folly::to<std::string>(value.value);
    case YGUnitPercent:
      return folly::to<std::string>(value.value) + "%";
    case YGUnitAuto:
      return "auto";
  }
}

inline std::string toString(const YGFloatOptional &value) {
  if (value.isUndefined()) {
    return "undefined";
  }

  return folly::to<std::string>(floatFromYogaFloat(value.getValue()));
}

inline std::string toString(
    const std::array<YGValue, YGDimensionCount> &value) {
  return "{" + toString(value[0]) + ", " + toString(value[1]) + "}";
}

inline std::string toString(const std::array<YGValue, YGEdgeCount> &value) {
  static std::array<std::string, YGEdgeCount> names = {{"left",
                                                        "top",
                                                        "right",
                                                        "bottom",
                                                        "start",
                                                        "end",
                                                        "horizontal",
                                                        "vertical",
                                                        "all"}};

  auto result = std::string{};
  auto separator = std::string{", "};

  for (auto i = 0; i < YGEdgeCount; i++) {
    if (value[i].unit == YGUnitUndefined) {
      continue;
    }
    result += names[i] + ": " + toString(value[i]) + separator;
  }

  if (!result.empty()) {
    result.erase(result.length() - separator.length());
  }

  return "{" + result + "}";
}

} // namespace react
} // namespace facebook
