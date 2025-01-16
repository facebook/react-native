/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <react/debug/react_native_expect.h>
#include <react/renderer/components/view/primitives.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/graphics/BackgroundImage.h>
#include <react/renderer/graphics/BlendMode.h>
#include <react/renderer/graphics/BoxShadow.h>
#include <react/renderer/graphics/Filter.h>
#include <react/renderer/graphics/Isolation.h>
#include <react/renderer/graphics/LinearGradient.h>
#include <react/renderer/graphics/PlatformColorParser.h>
#include <react/renderer/graphics/Transform.h>
#include <react/renderer/graphics/ValueUnit.h>
#include <stdlib.h>
#include <yoga/YGEnums.h>
#include <yoga/node/Node.h>
#include <algorithm>
#include <cmath>
#include <optional>
#include <string>
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
 * Converts string to float only if the entire string is valid float.
 */
inline std::optional<float> stringToFloat(const std::string& string) {
  try {
    size_t pos = 0;
    auto result = std::stof(string, &pos);
    // Check if entire string was valid
    if (pos == string.length()) {
      return result;
    }
  } catch (...) {
    // Ignore, caller falls back to default value.
    return std::nullopt;
  }

  return std::nullopt;
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
  if (length.isPoints()) {
    return floatFromYogaOptionalFloat(length.value());
  } else if (length.isPercent()) {
    return base.has_value()
        ? std::optional<Float>(
              base.value() * floatFromYogaOptionalFloat(length.value()))
        : std::optional<Float>();
  } else {
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

inline DisplayType displayTypeFromYGDisplay(YGDisplay display) {
  switch (display) {
    case YGDisplayNone:
      return DisplayType::None;
    case YGDisplayContents:
      return DisplayType::Contents;
    case YGDisplayFlex:
      return DisplayType::Flex;
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

  layoutMetrics.displayType =
      displayTypeFromYGDisplay(YGNodeStyleGetDisplay(&yogaNode));

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
  LOG(ERROR) << "Could not parse yoga::Direction: " << stringValue;
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
  LOG(ERROR) << "Could not parse yoga::FlexDirection: " << stringValue;
}

inline void fromRawValue(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    yoga::BoxSizing& result) {
  result = yoga::BoxSizing::BorderBox;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "border-box") {
    result = yoga::BoxSizing::BorderBox;
    return;
  }
  if (stringValue == "content-box") {
    result = yoga::BoxSizing::ContentBox;
    return;
  }

  LOG(ERROR) << "Could not parse yoga::BoxSizing: " << stringValue;
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
  LOG(ERROR) << "Could not parse yoga::Justify: " << stringValue;
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
  LOG(ERROR) << "Could not parse yoga::Align: " << stringValue;
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
  LOG(ERROR) << "Could not parse yoga::PositionType: " << stringValue;
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
  LOG(ERROR) << "Could not parse yoga::Wrap: " << stringValue;
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
  if (stringValue == "contents") {
    result = yoga::Display::Contents;
    return;
  }
  LOG(ERROR) << "Could not parse yoga::Display: " << stringValue;
}

inline void fromRawValue(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    yoga::Style::SizeLength& result) {
  if (value.hasType<Float>()) {
    result = yoga::StyleSizeLength::points((float)value);
    return;
  } else if (value.hasType<std::string>()) {
    const auto stringValue = (std::string)value;
    if (stringValue == "auto") {
      result = yoga::StyleSizeLength::ofAuto();
      return;
    } else if (stringValue == "max-content") {
      result = yoga::StyleSizeLength::ofMaxContent();
      return;
    } else if (stringValue == "stretch") {
      result = yoga::StyleSizeLength::ofStretch();
      return;
    } else if (stringValue == "fit-content") {
      result = yoga::StyleSizeLength::ofFitContent();
      return;
    } else {
      if (stringValue.back() == '%') {
        auto tryValue =
            stringToFloat(stringValue.substr(0, stringValue.length() - 1));
        if (tryValue.has_value()) {
          result = yoga::StyleSizeLength::percent(tryValue.value());
          return;
        }
      } else {
        auto tryValue = stringToFloat(stringValue);
        if (tryValue.has_value()) {
          result = yoga::StyleSizeLength::points(tryValue.value());
          return;
        }
      }
    }
  }
  result = yoga::StyleSizeLength::undefined();
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    yoga::Style::Length& result) {
  if (value.hasType<Float>()) {
    result = yoga::StyleLength::points((float)value);
    return;
  } else if (value.hasType<std::string>()) {
    const auto stringValue = (std::string)value;
    if (stringValue == "auto") {
      result = yoga::StyleLength::ofAuto();
      return;
    } else {
      if (stringValue.back() == '%') {
        auto tryValue =
            stringToFloat(stringValue.substr(0, stringValue.length() - 1));
        if (tryValue.has_value()) {
          result = yoga::StyleLength::percent(tryValue.value());
          return;
        }
      } else {
        auto tryValue = stringToFloat(stringValue);
        if (tryValue.has_value()) {
          result = yoga::StyleLength::points(tryValue.value());
          return;
        }
      }
    }
  }
  result = yoga::StyleLength::undefined();
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
    const PropsParserContext& /*context*/,
    const RawValue& value,
    ValueUnit& result) {
  react_native_expect(value.hasType<RawValue>());
  ValueUnit valueUnit;

  if (value.hasType<Float>()) {
    auto valueFloat = (float)value;
    if (std::isfinite(valueFloat)) {
      valueUnit = ValueUnit(valueFloat, UnitType::Point);
    } else {
      valueUnit = ValueUnit(0.0f, UnitType::Undefined);
    }
  } else if (value.hasType<std::string>()) {
    const auto stringValue = (std::string)value;

    if (stringValue.back() == '%') {
      auto tryValue =
          stringToFloat(stringValue.substr(0, stringValue.length() - 1));
      if (tryValue.has_value()) {
        valueUnit = ValueUnit(tryValue.value(), UnitType::Percent);
      }
    }
  }

  result = valueUnit;
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
    auto Zero = ValueUnit(0, UnitType::Point);
    auto One = ValueUnit(1, UnitType::Point);

    if (operation == "matrix") {
      react_native_expect(parameters.hasType<std::vector<Float>>());
      auto numbers = (std::vector<Float>)parameters;
      react_native_expect(numbers.size() == transformMatrix.matrix.size());
      auto i = 0;
      for (auto number : numbers) {
        transformMatrix.matrix[i++] = number;
      }
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Arbitrary, Zero, Zero, Zero});
    } else if (operation == "perspective") {
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Perspective,
          ValueUnit((Float)parameters, UnitType::Point),
          Zero,
          Zero});
    } else if (operation == "rotateX") {
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Rotate,
          ValueUnit(toRadians(parameters, 0.0f), UnitType::Point),
          Zero,
          Zero});
    } else if (operation == "rotateY") {
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Rotate,
          Zero,
          ValueUnit(toRadians(parameters, 0.0f), UnitType::Point),
          Zero});
    } else if (operation == "rotateZ" || operation == "rotate") {
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Rotate,
          Zero,
          Zero,
          ValueUnit(toRadians(parameters, 0.0f), UnitType::Point)});
    } else if (operation == "scale") {
      auto number = ValueUnit((Float)parameters, UnitType::Point);
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Scale, number, number, number});
    } else if (operation == "scaleX") {
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Scale,
          ValueUnit((Float)parameters, UnitType::Point),
          One,
          One});
    } else if (operation == "scaleY") {
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Scale,
          One,
          ValueUnit((Float)parameters, UnitType::Point),
          One});
    } else if (operation == "scaleZ") {
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Scale,
          One,
          One,
          ValueUnit((Float)parameters, UnitType::Point)});
    } else if (operation == "translate") {
      auto numbers = (std::vector<RawValue>)parameters;
      ValueUnit valueX;
      fromRawValue(context, numbers.at(0), valueX);
      ValueUnit valueY;
      fromRawValue(context, numbers.at(1), valueY);
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Translate, valueX, valueY, Zero});
    } else if (operation == "translateX") {
      ValueUnit valueX;
      fromRawValue(context, parameters, valueX);
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Translate, valueX, Zero, Zero});
    } else if (operation == "translateY") {
      ValueUnit valueY;
      fromRawValue(context, parameters, valueY);
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Translate, Zero, valueY, Zero});
    } else if (operation == "skewX") {
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Skew,
          ValueUnit(toRadians(parameters, 0.0f), UnitType::Point),
          Zero,
          Zero});
    } else if (operation == "skewY") {
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Skew,
          Zero,
          ValueUnit(toRadians(parameters, 0.0f), UnitType::Point),
          Zero});
    }
  }

  result = transformMatrix;
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    TransformOrigin& result) {
  react_native_expect(value.hasType<std::vector<RawValue>>());
  auto origins = (std::vector<RawValue>)value;

  TransformOrigin transformOrigin;

  const size_t maxIndex = 2;

  for (size_t i = 0; i < std::min(origins.size(), maxIndex); i++) {
    const auto& origin = origins[i];
    fromRawValue(context, origin, transformOrigin.xy[i]);
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
    OutlineStyle& result) {
  result = OutlineStyle::Solid;
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    return;
  }
  auto stringValue = (std::string)value;
  if (stringValue == "solid") {
    result = OutlineStyle::Solid;
    return;
  }
  if (stringValue == "dotted") {
    result = OutlineStyle::Dotted;
    return;
  }
  if (stringValue == "dashed") {
    result = OutlineStyle::Dashed;
    return;
  }
  LOG(ERROR) << "Could not parse OutlineStyle:" << stringValue;
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
  if (stringValue == "alias") {
    result = Cursor::Alias;
    return;
  }
  if (stringValue == "all-scroll") {
    result = Cursor::AllScroll;
    return;
  }
  if (stringValue == "auto") {
    result = Cursor::Auto;
    return;
  }
  if (stringValue == "cell") {
    result = Cursor::Cell;
    return;
  }
  if (stringValue == "col-resize") {
    result = Cursor::ColResize;
    return;
  }
  if (stringValue == "context-menu") {
    result = Cursor::ContextMenu;
    return;
  }
  if (stringValue == "copy") {
    result = Cursor::Copy;
    return;
  }
  if (stringValue == "crosshair") {
    result = Cursor::Crosshair;
    return;
  }
  if (stringValue == "default") {
    result = Cursor::Default;
    return;
  }
  if (stringValue == "e-resize") {
    result = Cursor::EResize;
    return;
  }
  if (stringValue == "ew-resize") {
    result = Cursor::EWResize;
    return;
  }
  if (stringValue == "grab") {
    result = Cursor::Grab;
    return;
  }
  if (stringValue == "grabbing") {
    result = Cursor::Grabbing;
    return;
  }
  if (stringValue == "help") {
    result = Cursor::Help;
    return;
  }
  if (stringValue == "move") {
    result = Cursor::Move;
    return;
  }
  if (stringValue == "n-resize") {
    result = Cursor::NResize;
    return;
  }
  if (stringValue == "ne-resize") {
    result = Cursor::NEResize;
    return;
  }
  if (stringValue == "nesw-resize") {
    result = Cursor::NESWResize;
    return;
  }
  if (stringValue == "ns-resize") {
    result = Cursor::NSResize;
    return;
  }
  if (stringValue == "nw-resize") {
    result = Cursor::NWResize;
    return;
  }
  if (stringValue == "nwse-resize") {
    result = Cursor::NWSEResize;
    return;
  }
  if (stringValue == "no-drop") {
    result = Cursor::NoDrop;
    return;
  }
  if (stringValue == "none") {
    result = Cursor::None;
    return;
  }
  if (stringValue == "not-allowed") {
    result = Cursor::NotAllowed;
    return;
  }
  if (stringValue == "pointer") {
    result = Cursor::Pointer;
    return;
  }
  if (stringValue == "progress") {
    result = Cursor::Progress;
    return;
  }
  if (stringValue == "row-resize") {
    result = Cursor::RowResize;
    return;
  }
  if (stringValue == "s-resize") {
    result = Cursor::SResize;
    return;
  }
  if (stringValue == "se-resize") {
    result = Cursor::SEResize;
    return;
  }
  if (stringValue == "sw-resize") {
    result = Cursor::SWResize;
    return;
  }
  if (stringValue == "text") {
    result = Cursor::Text;
    return;
  }
  if (stringValue == "url") {
    result = Cursor::Url;
    return;
  }
  if (stringValue == "w-resize") {
    result = Cursor::WResize;
    return;
  }
  if (stringValue == "wait") {
    result = Cursor::Wait;
    return;
  }
  if (stringValue == "zoom-in") {
    result = Cursor::ZoomIn;
    return;
  }
  if (stringValue == "zoom-out") {
    result = Cursor::ZoomOut;
    return;
  }
  LOG(ERROR) << "Could not parse Cursor:" << stringValue;
  react_native_expect(false);
}

inline void fromRawValue(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    LayoutConformance& result) {
  react_native_expect(value.hasType<std::string>());
  result = LayoutConformance::Strict;
  if (!value.hasType<std::string>()) {
    return;
  }

  auto stringValue = (std::string)value;
  if (stringValue == "strict") {
    result = LayoutConformance::Strict;
  } else if (stringValue == "compatibility") {
    result = LayoutConformance::Compatibility;
  } else {
    LOG(ERROR) << "Unexpected LayoutConformance value:" << stringValue;
    react_native_expect(false);
  }
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    std::vector<BoxShadow>& result) {
  react_native_expect(value.hasType<std::vector<RawValue>>());
  if (!value.hasType<std::vector<RawValue>>()) {
    result = {};
    return;
  }

  std::vector<BoxShadow> boxShadows{};
  auto rawBoxShadows = static_cast<std::vector<RawValue>>(value);
  for (const auto& rawBoxShadow : rawBoxShadows) {
    bool isMap =
        rawBoxShadow.hasType<std::unordered_map<std::string, RawValue>>();
    react_native_expect(isMap);
    if (!isMap) {
      // If any box shadow is malformed then we should not apply any of them
      // which is the web behavior.
      result = {};
      return;
    }

    auto rawBoxShadowMap =
        static_cast<std::unordered_map<std::string, RawValue>>(rawBoxShadow);
    BoxShadow boxShadow{};
    auto offsetX = rawBoxShadowMap.find("offsetX");
    react_native_expect(offsetX != rawBoxShadowMap.end());
    if (offsetX == rawBoxShadowMap.end()) {
      result = {};
      return;
    }
    react_native_expect(offsetX->second.hasType<Float>());
    if (!offsetX->second.hasType<Float>()) {
      result = {};
      return;
    }
    boxShadow.offsetX = (Float)offsetX->second;

    auto offsetY = rawBoxShadowMap.find("offsetY");
    react_native_expect(offsetY != rawBoxShadowMap.end());
    if (offsetY == rawBoxShadowMap.end()) {
      result = {};
      return;
    }
    react_native_expect(offsetY->second.hasType<Float>());
    if (!offsetY->second.hasType<Float>()) {
      result = {};
      return;
    }
    boxShadow.offsetY = (Float)offsetY->second;

    auto blurRadius = rawBoxShadowMap.find("blurRadius");
    if (blurRadius != rawBoxShadowMap.end()) {
      react_native_expect(blurRadius->second.hasType<Float>());
      if (!blurRadius->second.hasType<Float>()) {
        result = {};
        return;
      }
      boxShadow.blurRadius = (Float)blurRadius->second;
    }

    auto spreadDistance = rawBoxShadowMap.find("spreadDistance");
    if (spreadDistance != rawBoxShadowMap.end()) {
      react_native_expect(spreadDistance->second.hasType<Float>());
      if (!spreadDistance->second.hasType<Float>()) {
        result = {};
        return;
      }
      boxShadow.spreadDistance = (Float)spreadDistance->second;
    }

    auto inset = rawBoxShadowMap.find("inset");
    if (inset != rawBoxShadowMap.end()) {
      react_native_expect(inset->second.hasType<bool>());
      if (!inset->second.hasType<bool>()) {
        result = {};
        return;
      }
      boxShadow.inset = (bool)inset->second;
    }

    auto color = rawBoxShadowMap.find("color");
    if (color != rawBoxShadowMap.end()) {
      fromRawValue(
          context.contextContainer,
          context.surfaceId,
          color->second,
          boxShadow.color);
    }

    boxShadows.push_back(boxShadow);
  }

  result = boxShadows;
}
inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    std::vector<FilterFunction>& result) {
  react_native_expect(value.hasType<std::vector<RawValue>>());
  if (!value.hasType<std::vector<RawValue>>()) {
    result = {};
    return;
  }

  std::vector<FilterFunction> filter{};
  auto rawFilter = static_cast<std::vector<RawValue>>(value);
  for (const auto& rawFilterPrimitive : rawFilter) {
    bool isMap =
        rawFilterPrimitive.hasType<std::unordered_map<std::string, RawValue>>();
    react_native_expect(isMap);
    if (!isMap) {
      // If a filter is malformed then we should not apply any of them which
      // is the web behavior.
      result = {};
      return;
    }

    auto rawFilterFunction =
        static_cast<std::unordered_map<std::string, RawValue>>(
            rawFilterPrimitive);
    FilterFunction filterFunction{};
    try {
      filterFunction.type =
          filterTypeFromString(rawFilterFunction.begin()->first);
      if (filterFunction.type == FilterType::DropShadow) {
        auto rawDropShadow =
            static_cast<std::unordered_map<std::string, RawValue>>(
                rawFilterFunction.begin()->second);
        DropShadowParams dropShadowParams{};

        auto offsetX = rawDropShadow.find("offsetX");
        react_native_expect(offsetX != rawDropShadow.end());
        if (offsetX == rawDropShadow.end()) {
          result = {};
          return;
        }

        react_native_expect(offsetX->second.hasType<Float>());
        if (!offsetX->second.hasType<Float>()) {
          result = {};
          return;
        }
        dropShadowParams.offsetX = (Float)offsetX->second;

        auto offsetY = rawDropShadow.find("offsetY");
        react_native_expect(offsetY != rawDropShadow.end());
        if (offsetY == rawDropShadow.end()) {
          result = {};
          return;
        }
        react_native_expect(offsetY->second.hasType<Float>());
        if (!offsetY->second.hasType<Float>()) {
          result = {};
          return;
        }
        dropShadowParams.offsetY = (Float)offsetY->second;

        auto standardDeviation = rawDropShadow.find("standardDeviation");
        if (standardDeviation != rawDropShadow.end()) {
          react_native_expect(standardDeviation->second.hasType<Float>());
          if (!standardDeviation->second.hasType<Float>()) {
            result = {};
            return;
          }
          dropShadowParams.standardDeviation = (Float)standardDeviation->second;
        }

        auto color = rawDropShadow.find("color");
        if (color != rawDropShadow.end()) {
          fromRawValue(
              context.contextContainer,
              context.surfaceId,
              color->second,
              dropShadowParams.color);
        }

        filterFunction.parameters = dropShadowParams;
      } else {
        filterFunction.parameters = (float)rawFilterFunction.begin()->second;
      }
      filter.push_back(std::move(filterFunction));
    } catch (const std::exception& e) {
      LOG(ERROR) << "Could not parse FilterFunction: " << e.what();
      result = {};
      return;
    }
  }

  result = filter;
}

inline void fromRawValue(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    BlendMode& result) {
  react_native_expect(value.hasType<std::string>());
  result = BlendMode::Normal;
  if (!value.hasType<std::string>()) {
    return;
  }

  auto rawBlendMode = static_cast<std::string>(value);
  std::optional<BlendMode> blendMode = blendModeFromString(rawBlendMode);

  if (!blendMode) {
    LOG(ERROR) << "Could not parse blend mode: " << rawBlendMode;
    return;
  }

  result = blendMode.value();
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    std::vector<BackgroundImage>& result) {
  react_native_expect(value.hasType<std::vector<RawValue>>());
  if (!value.hasType<std::vector<RawValue>>()) {
    result = {};
    return;
  }

  std::vector<BackgroundImage> backgroundImage{};
  auto rawBackgroundImage = static_cast<std::vector<RawValue>>(value);
  for (const auto& rawBackgroundImageValue : rawBackgroundImage) {
    bool isMap = rawBackgroundImageValue
                     .hasType<std::unordered_map<std::string, RawValue>>();
    react_native_expect(isMap);
    if (!isMap) {
      result = {};
      return;
    }

    auto rawBackgroundImageMap =
        static_cast<std::unordered_map<std::string, RawValue>>(
            rawBackgroundImageValue);

    auto typeIt = rawBackgroundImageMap.find("type");
    if (typeIt == rawBackgroundImageMap.end() ||
        !typeIt->second.hasType<std::string>()) {
      continue;
    }

    std::string type = (std::string)(typeIt->second);
    if (type == "linearGradient") {
      LinearGradient linearGradient;

      auto directionIt = rawBackgroundImageMap.find("direction");
      if (directionIt != rawBackgroundImageMap.end() &&
          directionIt->second
              .hasType<std::unordered_map<std::string, RawValue>>()) {
        auto directionMap =
            static_cast<std::unordered_map<std::string, RawValue>>(
                directionIt->second);

        auto directionTypeIt = directionMap.find("type");
        auto valueIt = directionMap.find("value");

        if (directionTypeIt != directionMap.end() &&
            valueIt != directionMap.end()) {
          std::string directionType = (std::string)(directionTypeIt->second);

          if (directionType == "angle") {
            linearGradient.direction.type = GradientDirectionType::Angle;
            if (valueIt->second.hasType<Float>()) {
              linearGradient.direction.value = (Float)(valueIt->second);
            }
          } else if (directionType == "keyword") {
            linearGradient.direction.type = GradientDirectionType::Keyword;
            if (valueIt->second.hasType<std::string>()) {
              linearGradient.direction.value =
                  parseGradientKeyword((std::string)(valueIt->second));
            }
          }
        }
      }

      auto colorStopsIt = rawBackgroundImageMap.find("colorStops");
      if (colorStopsIt != rawBackgroundImageMap.end() &&
          colorStopsIt->second.hasType<std::vector<RawValue>>()) {
        auto rawColorStops =
            static_cast<std::vector<RawValue>>(colorStopsIt->second);

        for (const auto& stop : rawColorStops) {
          if (stop.hasType<std::unordered_map<std::string, RawValue>>()) {
            auto stopMap =
                static_cast<std::unordered_map<std::string, RawValue>>(stop);
            auto positionIt = stopMap.find("position");
            auto colorIt = stopMap.find("color");

            if (positionIt != stopMap.end() && colorIt != stopMap.end() &&
                positionIt->second.hasType<Float>()) {
              ColorStop colorStop;
              colorStop.position = (Float)(positionIt->second);
              fromRawValue(context, colorIt->second, colorStop.color);
              linearGradient.colorStops.push_back(colorStop);
            }
          }
        }
      }

      backgroundImage.push_back(std::move(linearGradient));
    }
  }

  result = backgroundImage;
}

inline void fromRawValue(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    Isolation& result) {
  react_native_expect(value.hasType<std::string>());
  result = Isolation::Auto;
  if (!value.hasType<std::string>()) {
    return;
  }

  auto rawIsolation = static_cast<std::string>(value);
  std::optional<Isolation> isolation = isolationFromString(rawIsolation);

  if (!isolation) {
    LOG(ERROR) << "Could not parse isolation: " << rawIsolation;
    return;
  }

  result = isolation.value();
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
  if (length.isUndefined()) {
    return "undefined";
  } else if (length.isAuto()) {
    return "auto";
  } else if (length.isPoints()) {
    return std::to_string(length.value().unwrap());
  } else if (length.isPercent()) {
    return std::to_string(length.value().unwrap()) + "%";
  } else {
    return "unknown";
  }
}

inline std::string toString(const yoga::Style::SizeLength& length) {
  if (length.isUndefined()) {
    return "undefined";
  } else if (length.isAuto()) {
    return "auto";
  } else if (length.isPoints()) {
    return std::to_string(length.value().unwrap());
  } else if (length.isPercent()) {
    return std::to_string(length.value().unwrap()) + "%";
  } else if (length.isMaxContent()) {
    return "max-content";
  } else if (length.isFitContent()) {
    return "fit-content";
  } else if (length.isStretch()) {
    return "stretch";
  } else {
    return "unknown";
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
    case LayoutConformance::Strict:
      return "strict";
    case LayoutConformance::Compatibility:
      return "compatibility";
  }
}

} // namespace facebook::react
