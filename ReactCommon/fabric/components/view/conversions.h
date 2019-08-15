/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/map.h>
#include <folly/Conv.h>
#include <folly/dynamic.h>
#include <glog/logging.h>
#include <react/components/view/primitives.h>
#include <react/core/LayoutMetrics.h>
#include <react/graphics/Geometry.h>
#include <react/graphics/Transform.h>
#include <stdlib.h>
#include <yoga/YGEnums.h>
#include <yoga/YGNode.h>
#include <yoga/Yoga.h>
#include <cmath>

namespace facebook {
namespace react {

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
inline Float floatFromYogaFloat(float value) {
  static_assert(
      YGUndefined != YGUndefined,
      "The code of this function assumes that YGUndefined is NaN.");
  if (std::isnan(value) /* means: `value == YGUndefined` */) {
    return std::numeric_limits<Float>::infinity();
  }

  return (Float)value;
}

inline float yogaFloatFromFloat(Float value) {
  if (std::isinf(value)) {
    return YGUndefined;
  }

  return (float)value;
}

/*
 * `YGFloatOptional` <-> React Native's `Float`
 *
 * `YGFloatOptional` represents optional dimensionless float values in Yoga
 * Style object (e.g. `flex`). The most suitable analogy to empty
 * `YGFloatOptional` is `NaN` value.
 * `YGFloatOptional` values are usually parsed from some outside data source
 * which usually has some special corresponding representation for an empty
 * value.
 */
inline Float floatFromYogaOptionalFloat(YGFloatOptional value) {
  if (value.isUndefined()) {
    return std::numeric_limits<Float>::quiet_NaN();
  }

  return floatFromYogaFloat(value.unwrap());
}

inline YGFloatOptional yogaOptionalFloatFromFloat(Float value) {
  if (std::isnan(value)) {
    return YGFloatOptional();
  }

  return YGFloatOptional((float)value);
}

/*
 * `YGValue` <-> `React Native's `Float`
 *
 * `YGValue` represents optional dimensionful (a real number and some unit, e.g.
 * pixels).
 */
inline YGValue yogaStyleValueFromFloat(
    const Float &value,
    YGUnit unit = YGUnitPoint) {
  if (std::isnan(value)) {
    return YGValueUndefined;
  }

  return {(float)value, unit};
}

inline folly::Optional<Float> optionalFloatFromYogaValue(
    const YGValue value,
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

  layoutMetrics.displayType = yogaNode.getStyle().display() == YGDisplayNone
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

inline void fromRawValue(const RawValue &value, YGDirection &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
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
  LOG(FATAL) << "Could not parse YGDirection:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, YGFlexDirection &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "row") {
    result = YGFlexDirectionRow;
    return;
  }
  if (stringValue == "column") {
    result = YGFlexDirectionColumn;
    return;
  }
  if (stringValue == "column-reverse") {
    result = YGFlexDirectionColumnReverse;
    return;
  }
  if (stringValue == "row-reverse") {
    result = YGFlexDirectionRowReverse;
    return;
  }
  LOG(FATAL) << "Could not parse YGFlexDirection:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, YGJustify &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
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
  LOG(FATAL) << "Could not parse YGJustify:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, YGAlign &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
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
  LOG(FATAL) << "Could not parse YGAlign:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, YGPositionType &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "relative") {
    result = YGPositionTypeRelative;
    return;
  }
  if (stringValue == "absolute") {
    result = YGPositionTypeAbsolute;
    return;
  }
  LOG(FATAL) << "Could not parse YGPositionType:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, YGWrap &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "nowrap") {
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
  LOG(FATAL) << "Could not parse YGWrap:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, YGOverflow &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
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
  LOG(FATAL) << "Could not parse YGOverflow:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, YGDisplay &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "flex") {
    result = YGDisplayFlex;
    return;
  }
  if (stringValue == "none") {
    result = YGDisplayNone;
    return;
  }
  LOG(FATAL) << "Could not parse YGDisplay:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, YGStyle::ValueRepr &result) {
  if (value.hasType<Float>()) {
    result = yogaStyleValueFromFloat((Float)value);
    return;
  } else if (value.hasType<std::string>()) {
    const auto stringValue = (std::string)value;
    if (stringValue == "auto") {
      result = YGValueUndefined;
      return;
    } else {
      if (stringValue.back() == '%') {
        result = YGValue{
            folly::to<float>(stringValue.substr(0, stringValue.length() - 1)),
            YGUnitPercent};
        return;
      } else {
        result = YGValue{folly::to<float>(stringValue), YGUnitPoint};
        return;
      }
    }
  }
  result = YGValueUndefined;
}

inline void fromRawValue(const RawValue &value, YGFloatOptional &result) {
  if (value.hasType<float>()) {
    result = YGFloatOptional((float)value);
    return;
  } else if (value.hasType<std::string>()) {
    const auto stringValue = (std::string)value;
    if (stringValue == "auto") {
      result = YGFloatOptional();
      return;
    }
  }
  LOG(FATAL) << "Could not parse YGFloatOptional";
  assert(false);
}

inline Float toRadians(const RawValue &value) {
  if (value.hasType<Float>()) {
    return (Float)value;
  }
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  char *suffixStart;
  double num = strtod(
      stringValue.c_str(), &suffixStart); // can't use std::stod, probably
                                          // because of old Android NDKs
  if (0 == strncmp(suffixStart, "deg", 3)) {
    return num * M_PI / 180;
  }
  return num; // assume suffix is "rad"
}

inline void fromRawValue(const RawValue &value, Transform &result) {
  assert(value.hasType<std::vector<RawValue>>());
  auto transformMatrix = Transform{};
  auto configurations = (std::vector<RawValue>)value;

  for (const auto &configuration : configurations) {
    auto configurationPair = (better::map<std::string, RawValue>)configuration;
    auto pair = configurationPair.begin();
    auto operation = pair->first;
    auto &parameters = pair->second;

    if (operation == "matrix") {
      assert(parameters.hasType<std::vector<Float>>());
      auto numbers = (std::vector<Float>)parameters;
      assert(numbers.size() == transformMatrix.matrix.size());
      auto i = 0;
      for (auto number : numbers) {
        transformMatrix.matrix[i++] = number;
      }
    } else if (operation == "perspective") {
      transformMatrix =
          transformMatrix * Transform::Perspective((Float)parameters);
    } else if (operation == "rotateX") {
      transformMatrix =
          transformMatrix * Transform::Rotate(toRadians(parameters), 0, 0);
    } else if (operation == "rotateY") {
      transformMatrix =
          transformMatrix * Transform::Rotate(0, toRadians(parameters), 0);
    } else if (operation == "rotateZ" || operation == "rotate") {
      transformMatrix =
          transformMatrix * Transform::Rotate(0, 0, toRadians(parameters));
    } else if (operation == "scale") {
      auto number = (Float)parameters;
      transformMatrix =
          transformMatrix * Transform::Scale(number, number, number);
    } else if (operation == "scaleX") {
      transformMatrix =
          transformMatrix * Transform::Scale((Float)parameters, 0, 0);
    } else if (operation == "scaleY") {
      transformMatrix =
          transformMatrix * Transform::Scale(0, (Float)parameters, 0);
    } else if (operation == "scaleZ") {
      transformMatrix =
          transformMatrix * Transform::Scale(0, 0, (Float)parameters);
    } else if (operation == "translate") {
      auto numbers = (std::vector<Float>)parameters;
      transformMatrix = transformMatrix *
          Transform::Translate(numbers.at(0), numbers.at(1), 0);
    } else if (operation == "translateX") {
      transformMatrix =
          transformMatrix * Transform::Translate((Float)parameters, 0, 0);
    } else if (operation == "translateY") {
      transformMatrix =
          transformMatrix * Transform::Translate(0, (Float)parameters, 0);
    } else if (operation == "skewX") {
      transformMatrix =
          transformMatrix * Transform::Skew(toRadians(parameters), 0);
    } else if (operation == "skewY") {
      transformMatrix =
          transformMatrix * Transform::Skew(0, toRadians(parameters));
    }
  }

  result = transformMatrix;
}

inline void fromRawValue(const RawValue &value, PointerEventsMode &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
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
  LOG(FATAL) << "Could not parse PointerEventsMode:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, BackfaceVisibility &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "auto") {
    result = BackfaceVisibility::Auto;
    return;
  }
  if (stringValue == "visible") {
    result = BackfaceVisibility::Visible;
    return;
  }
  if (stringValue == "hidden") {
    result = BackfaceVisibility::Hidden;
    return;
  }
  LOG(FATAL) << "Could not parse BackfaceVisibility:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, BorderStyle &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
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
  LOG(FATAL) << "Could not parse BorderStyle:" << stringValue;
  assert(false);
}

inline std::string toString(
    const std::array<float, yoga::enums::count<YGDimension>()> &dimensions) {
  return "{" + folly::to<std::string>(dimensions[0]) + ", " +
      folly::to<std::string>(dimensions[1]) + "}";
}

inline std::string toString(const std::array<float, 4> &position) {
  return "{" + folly::to<std::string>(position[0]) + ", " +
      folly::to<std::string>(position[1]) + "}";
}

inline std::string toString(
    const std::array<float, yoga::enums::count<YGEdge>()> &edges) {
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

  return folly::to<std::string>(floatFromYogaFloat(value.unwrap()));
}

inline std::string toString(const YGStyle::Dimensions &value) {
  return "{" + toString(value[0]) + ", " + toString(value[1]) + "}";
}

inline std::string toString(const YGStyle::Edges &value) {
  static std::array<std::string, yoga::enums::count<YGEdge>()> names = {
      {"left",
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

  for (auto i = 0; i < yoga::enums::count<YGEdge>(); i++) {
    YGValue v = value[i];
    if (v.unit == YGUnitUndefined) {
      continue;
    }
    result += names[i] + ": " + toString(v) + separator;
  }

  if (!result.empty()) {
    result.erase(result.length() - separator.length());
  }

  return "{" + result + "}";
}

} // namespace react
} // namespace facebook
