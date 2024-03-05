/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Conv.h>
#include <folly/dynamic.h>
#include <glog/logging.h>
#include <react/debug/react_native_expect.h>
#include <react/renderer/components/view/primitives.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/graphics/Transform.h>
#include <react/renderer/graphics/ValueUnit.h>
#include <stdlib.h>
#include <yoga/YGEnums.h>
#include <yoga/node/Node.h>
#include <algorithm>
#include <cmath>
#include <optional>
#include <unordered_map>

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
inline Float floatFromYogaOptionalFloat(yoga::FloatOptional value) {
  if (value.isUndefined()) {
    return std::numeric_limits<Float>::quiet_NaN();
  }

  return floatFromYogaFloat(value.unwrap());
}

inline yoga::FloatOptional yogaOptionalFloatFromFloat(Float value) {
  if (std::isnan(value)) {
    return yoga::FloatOptional();
  }

  return yoga::FloatOptional((float)value);
}

inline std::optional<Float> optionalFloatFromYogaValue(
    const yoga::Style::Length& length,
    std::optional<Float> base = {}) {
  switch (length.unit()) {
    case yoga::Unit::Undefined:
      return {};
    case yoga::Unit::Point:
      return floatFromYogaOptionalFloat(length.value());
    case yoga::Unit::Percent:
      return base.has_value()
          ? std::optional<Float>(
                base.value() * floatFromYogaOptionalFloat(length.value()))
          : std::optional<Float>();
    case yoga::Unit::Auto:
      return {};
  }
}

static inline PositionType positionTypeFromYogaPositionType(
    yoga::PositionType positionType) {
  switch (positionType) {
    case yoga::PositionType::Static:
      return PositionType::Static;
    case yoga::PositionType::Relative:
      return PositionType::Relative;
    case yoga::PositionType::Absolute:
      return PositionType::Absolute;
  }
}

inline LayoutMetrics layoutMetricsFromYogaNode(yoga::Node& yogaNode) {
  auto layoutMetrics = LayoutMetrics{};

  layoutMetrics.frame = Rect{
      Point{
          floatFromYogaFloat(YGNodeLayoutGetLeft(&yogaNode)),
          floatFromYogaFloat(YGNodeLayoutGetTop(&yogaNode))},
      Size{
          floatFromYogaFloat(YGNodeLayoutGetWidth(&yogaNode)),
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

  layoutMetrics.displayType = yogaNode.style().display() == yoga::Display::None
      ? DisplayType::None
      : DisplayType::Flex;

  layoutMetrics.positionType =
      positionTypeFromYogaPositionType(yogaNode.style().positionType());

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

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    yoga::Direction& result) {
  result = yoga::Direction::Inherit;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "inherit") {
    result = yoga::Direction::Inherit;
    return;
  }
  if (stringValue == "ltr") {
    result = yoga::Direction::LTR;
    return;
  }
  if (stringValue == "rtl") {
    result = yoga::Direction::RTL;
    return;
  }
  LOG(ERROR) << "Could not parse Direction:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    yoga::FlexDirection& result) {
  result = yoga::FlexDirection::Column;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "row") {
    result = yoga::FlexDirection::Row;
    return;
  }
  if (stringValue == "column") {
    result = yoga::FlexDirection::Column;
    return;
  }
  if (stringValue == "column-reverse") {
    result = yoga::FlexDirection::ColumnReverse;
    return;
  }
  if (stringValue == "row-reverse") {
    result = yoga::FlexDirection::RowReverse;
    return;
  }
  LOG(ERROR) << "Could not parse yoga::FlexDirection:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    yoga::Justify& result) {
  result = yoga::Justify::FlexStart;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "flex-start") {
    result = yoga::Justify::FlexStart;
    return;
  }
  if (stringValue == "center") {
    result = yoga::Justify::Center;
    return;
  }
  if (stringValue == "flex-end") {
    result = yoga::Justify::FlexEnd;
    return;
  }
  if (stringValue == "space-between") {
    result = yoga::Justify::SpaceBetween;
    return;
  }
  if (stringValue == "space-around") {
    result = yoga::Justify::SpaceAround;
    return;
  }
  if (stringValue == "space-evenly") {
    result = yoga::Justify::SpaceEvenly;
    return;
  }
  LOG(ERROR) << "Could not parse yoga::Justify:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    yoga::Align& result) {
  result = yoga::Align::Stretch;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "auto") {
    result = yoga::Align::Auto;
    return;
  }
  if (stringValue == "flex-start") {
    result = yoga::Align::FlexStart;
    return;
  }
  if (stringValue == "center") {
    result = yoga::Align::Center;
    return;
  }
  if (stringValue == "flex-end") {
    result = yoga::Align::FlexEnd;
    return;
  }
  if (stringValue == "stretch") {
    result = yoga::Align::Stretch;
    return;
  }
  if (stringValue == "baseline") {
    result = yoga::Align::Baseline;
    return;
  }
  if (stringValue == "space-between") {
    result = yoga::Align::SpaceBetween;
    return;
  }
  if (stringValue == "space-around") {
    result = yoga::Align::SpaceAround;
    return;
  }
  if (stringValue == "space-evenly") {
    result = yoga::Align::SpaceEvenly;
    return;
  }
  LOG(ERROR) << "Could not parse yoga::Align:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    yoga::PositionType& result) {
  result = yoga::PositionType::Relative;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "static") {
    result = yoga::PositionType::Static;
    return;
  }
  if (stringValue == "relative") {
    result = yoga::PositionType::Relative;
    return;
  }
  if (stringValue == "absolute") {
    result = yoga::PositionType::Absolute;
    return;
  }
  LOG(ERROR) << "Could not parse yoga::PositionType:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    yoga::Wrap& result) {
  result = yoga::Wrap::NoWrap;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "nowrap") {
    result = yoga::Wrap::NoWrap;
    return;
  }
  if (stringValue == "wrap") {
    result = yoga::Wrap::Wrap;
    return;
  }
  if (stringValue == "wrap-reverse") {
    result = yoga::Wrap::WrapReverse;
    return;
  }
  LOG(ERROR) << "Could not parse yoga::Wrap:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    yoga::Overflow& result) {
  result = yoga::Overflow::Visible;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "visible") {
    result = yoga::Overflow::Visible;
    return;
  }
  if (stringValue == "hidden") {
    result = yoga::Overflow::Hidden;
    return;
  }
  if (stringValue == "scroll") {
    result = yoga::Overflow::Scroll;
    return;
  }
  LOG(ERROR) << "Could not parse yoga::Overflow:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    yoga::Display& result) {
  result = yoga::Display::Flex;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "flex") {
    result = yoga::Display::Flex;
    return;
  }
  if (stringValue == "none") {
    result = yoga::Display::None;
    return;
  }
  LOG(ERROR) << "Could not parse yoga::Display:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    yoga::Style::Length& result) {
  if (value.hasType<Float>()) {
    result = yoga::value::points((float)value);
    return;
  } else if (value.hasType<std::string>()) {
    const auto stringValue = (std::string)value;
    if (stringValue == "auto") {
      result = yoga::value::ofAuto();
      return;
    } else {
      if (stringValue.back() == '%') {
        auto tryValue = folly::tryTo<float>(
            std::string_view(stringValue).substr(0, stringValue.length() - 1));
        if (tryValue.hasValue()) {
          result = yoga::value::percent(tryValue.value());
          return;
        }
      } else {
        auto tryValue = folly::tryTo<float>(stringValue);
        if (tryValue.hasValue()) {
          result = yoga::value::points(tryValue.value());
          return;
        }
      }
    }
  }
  result = yoga::value::undefined();
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    YGValue& result) {
  yoga::Style::Length length{};
  fromRawValue(context, value, length);
  result = (YGValue)length;
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    yoga::FloatOptional& result) {
  result = value.hasType<float>() ? yoga::FloatOptional((float)value)
                                  : yoga::FloatOptional();
}

inline Float toRadians(
    const RawValue& value,
    std::optional<Float> defaultValue) {
  if (value.hasType<Float>()) {
    return (Float)value;
  }
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>() && defaultValue.has_value()) {
    return *defaultValue;
  }
  auto stringValue = (std::string)value;
  char* suffixStart;
  double num = strtod(
      stringValue.c_str(), &suffixStart); // can't use std::stod, probably
                                          // because of old Android NDKs
  if (0 == strncmp(suffixStart, "deg", 3)) {
    return static_cast<Float>(num * M_PI / 180.0f);
  }
  return static_cast<Float>(num); // assume suffix is "rad"
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    Transform& result) {
  auto transformMatrix = Transform{};
  react_native_expect(value.hasType<std::vector<RawValue>>());
  if (!value.hasType<std::vector<RawValue>>()) {
    result = transformMatrix;
    return;
  }

  auto configurations = static_cast<std::vector<RawValue>>(value);
  for (const auto& configuration : configurations) {
    if (!configuration.hasType<std::unordered_map<std::string, RawValue>>()) {
      // TODO: The following checks have to be removed after codegen is shipped.
      // See T45151459.
      continue;
    }

    auto configurationPair =
        static_cast<std::unordered_map<std::string, RawValue>>(configuration);
    auto pair = configurationPair.begin();
    auto operation = pair->first;
    auto& parameters = pair->second;

    if (operation == "matrix") {
      react_native_expect(parameters.hasType<std::vector<Float>>());
      auto numbers = (std::vector<Float>)parameters;
      react_native_expect(numbers.size() == transformMatrix.matrix.size());
      auto i = 0;
      for (auto number : numbers) {
        transformMatrix.matrix[i++] = number;
      }
      transformMatrix.operations.push_back(
          TransformOperation{TransformOperationType::Arbitrary, 0, 0, 0});
    } else if (operation == "perspective") {
      transformMatrix =
          transformMatrix * Transform::Perspective((Float)parameters);
    } else if (operation == "rotateX") {
      transformMatrix = transformMatrix *
          Transform::Rotate(toRadians(parameters, 0.0f), 0, 0);
    } else if (operation == "rotateY") {
      transformMatrix = transformMatrix *
          Transform::Rotate(0, toRadians(parameters, 0.0f), 0);
    } else if (operation == "rotateZ" || operation == "rotate") {
      transformMatrix = transformMatrix *
          Transform::Rotate(0, 0, toRadians(parameters, 0.0f));
    } else if (operation == "scale") {
      auto number = (Float)parameters;
      transformMatrix =
          transformMatrix * Transform::Scale(number, number, number);
    } else if (operation == "scaleX") {
      transformMatrix =
          transformMatrix * Transform::Scale((Float)parameters, 1, 1);
    } else if (operation == "scaleY") {
      transformMatrix =
          transformMatrix * Transform::Scale(1, (Float)parameters, 1);
    } else if (operation == "scaleZ") {
      transformMatrix =
          transformMatrix * Transform::Scale(1, 1, (Float)parameters);
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
          transformMatrix * Transform::Skew(toRadians(parameters, 0.0f), 0);
    } else if (operation == "skewY") {
      transformMatrix =
          transformMatrix * Transform::Skew(0, toRadians(parameters, 0.0f));
    }
  }

  result = transformMatrix;
}

inline void fromRawValue(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    TransformOrigin& result) {
  react_native_expect(value.hasType<std::vector<RawValue>>());
  auto origins = (std::vector<RawValue>)value;

  TransformOrigin transformOrigin;

  const size_t maxIndex = 2;

  for (size_t i = 0; i < std::min(origins.size(), maxIndex); i++) {
    const auto& origin = origins[i];
    if (origin.hasType<Float>()) {
      auto originFloat = (float)origin;
      if (std::isfinite(originFloat)) {
        transformOrigin.xy[i] = ValueUnit(originFloat, UnitType::Point);
      } else {
        transformOrigin.xy[i] = ValueUnit(0.0f, UnitType::Undefined);
      }
    } else if (origin.hasType<std::string>()) {
      const auto stringValue = (std::string)origin;

      if (stringValue.back() == '%') {
        auto tryValue = folly::tryTo<float>(
            std::string_view(stringValue).substr(0, stringValue.length() - 1));
        if (tryValue.hasValue()) {
          transformOrigin.xy[i] =
              ValueUnit(tryValue.value(), UnitType::Percent);
        }
      }
    }
  }

  if (origins.size() >= 3 && origins[2].hasType<Float>()) {
    transformOrigin.z = (Float)origins[2];
  }

  result = transformOrigin;
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    PointerEventsMode& result) {
  result = PointerEventsMode::Auto;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
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
  LOG(ERROR) << "Could not parse PointerEventsMode:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    BackfaceVisibility& result) {
  result = BackfaceVisibility::Auto;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
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
  LOG(ERROR) << "Could not parse BackfaceVisibility:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    BorderCurve& result) {
  result = BorderCurve::Circular;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "circular") {
    result = BorderCurve::Circular;
    return;
  }
  if (stringValue == "continuous") {
    result = BorderCurve::Continuous;
    return;
  }
  LOG(ERROR) << "Could not parse BorderCurve:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    BorderStyle& result) {
  result = BorderStyle::Solid;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
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
  LOG(ERROR) << "Could not parse BorderStyle:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    Cursor& result) {
  result = Cursor::Auto;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "auto") {
    result = Cursor::Auto;
    return;
  }
  if (stringValue == "pointer") {
    result = Cursor::Pointer;
    return;
  }
  LOG(ERROR) << "Could not parse Cursor:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    LayoutConformance& result) {
  result = LayoutConformance::Classic;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "classic") {
    result = LayoutConformance::Classic;
    return;
  }
  if (stringValue == "strict") {
    result = LayoutConformance::Strict;
    return;
  }
  LOG(ERROR) << "Could not parse LayoutConformance:" << stringValue;
  react_native_expect(false);
}

template <size_t N>
inline std::string toString(const std::array<float, N> vec) {
  std::string s;

  s.append("{");
  for (size_t i = 0; i < N - 1; i++) {
    s.append(std::to_string(vec[i]) + ", ");
  }
  s.append(std::to_string(vec[N - 1]));
  s.append("}");

  return s;
}

inline std::string toString(const yoga::Direction& value) {
  return YGDirectionToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::FlexDirection& value) {
  return YGFlexDirectionToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::Justify& value) {
  return YGJustifyToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::Align& value) {
  return YGAlignToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::PositionType& value) {
  return YGPositionTypeToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::Wrap& value) {
  return YGWrapToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::Overflow& value) {
  return YGOverflowToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::Display& value) {
  return YGDisplayToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::Style::Length& length) {
  switch (length.unit()) {
    case yoga::Unit::Undefined:
      return "undefined";
    case yoga::Unit::Point:
      return std::to_string(length.value().unwrap());
    case yoga::Unit::Percent:
      return std::to_string(length.value().unwrap()) + "%";
    case yoga::Unit::Auto:
      return "auto";
  }
}

inline std::string toString(const yoga::FloatOptional& value) {
  if (value.isUndefined()) {
    return "undefined";
  }

  return std::to_string(value.unwrap());
}

inline std::string toString(const LayoutConformance& value) {
  switch (value) {
    case LayoutConformance::Undefined:
      return "undefined";
    case LayoutConformance::Classic:
      return "classic";
    case LayoutConformance::Strict:
      return "strict";
  }
}

} // namespace facebook::react
