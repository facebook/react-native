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
#include <react/renderer/css/CSSAngle.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/renderer/graphics/BackgroundImage.h>
#include <react/renderer/graphics/BlendMode.h>
#include <react/renderer/graphics/Isolation.h>
#include <react/renderer/graphics/LinearGradient.h>
#include <react/renderer/graphics/PlatformColorParser.h>
#include <react/renderer/graphics/Transform.h>
#include <react/renderer/graphics/ValueUnit.h>
#include <yoga/YGEnums.h>
#include <yoga/node/Node.h>
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
      auto parsed = parseCSSProperty<CSSNumber, CSSPercentage>(stringValue);
      if (std::holds_alternative<CSSPercentage>(parsed)) {
        result = yoga::StyleSizeLength::percent(
            std::get<CSSPercentage>(parsed).value);
        return;
      } else if (std::holds_alternative<CSSNumber>(parsed)) {
        result =
            yoga::StyleSizeLength::points(std::get<CSSNumber>(parsed).value);
        return;
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
      auto parsed = parseCSSProperty<CSSNumber, CSSPercentage>(stringValue);
      if (std::holds_alternative<CSSPercentage>(parsed)) {
        result =
            yoga::StyleLength::percent(std::get<CSSPercentage>(parsed).value);
        return;
      } else if (std::holds_alternative<CSSNumber>(parsed)) {
        result = yoga::StyleLength::points(std::get<CSSNumber>(parsed).value);
        return;
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

inline std::optional<Float> toRadians(const RawValue& value) {
  if (value.hasType<Float>()) {
    return (Float)value;
  }
  if (!value.hasType<std::string>()) {
    return {};
  }

  auto angle = parseCSSProperty<CSSAngle>((std::string)value);
  if (std::holds_alternative<CSSAngle>(angle)) {
    return std::get<CSSAngle>(angle).degrees * M_PI / 180.0f;
  }

  return {};
}

inline ValueUnit toValueUnit(const RawValue& value) {
  if (value.hasType<Float>()) {
    return ValueUnit((Float)value, UnitType::Point);
  }
  if (!value.hasType<std::string>()) {
    return {};
  }

  auto pct = parseCSSProperty<CSSPercentage>((std::string)value);
  if (std::holds_alternative<CSSPercentage>(pct)) {
    return ValueUnit(std::get<CSSPercentage>(pct).value, UnitType::Percent);
  }

  return {};
}

inline void fromRawValue(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    ValueUnit& result) {
  result = toValueUnit(value);
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
      result = {};
      return;
    }

    auto configurationPair =
        static_cast<std::unordered_map<std::string, RawValue>>(configuration);
    if (configurationPair.size() != 1) {
      result = {};
      return;
    }

    auto pair = configurationPair.begin();
    auto operation = pair->first;
    auto& parameters = pair->second;
    auto Zero = ValueUnit(0, UnitType::Point);
    auto One = ValueUnit(1, UnitType::Point);

    if (operation == "matrix") {
      // T215634510: We should support matrix transforms as part of a list of
      // transforms
      if (configurations.size() > 1) {
        result = {};
        return;
      }

      if (!parameters.hasType<std::vector<Float>>()) {
        result = {};
        return;
      }

      auto numbers = (std::vector<Float>)parameters;
      if (numbers.size() != 9 && numbers.size() != 16) {
        result = {};
        return;
      }

      size_t i = 0;
      for (auto number : numbers) {
        transformMatrix.matrix[i++] = number;
      }
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Arbitrary, Zero, Zero, Zero});
    } else if (operation == "perspective") {
      if (!parameters.hasType<Float>()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Perspective,
          ValueUnit((Float)parameters, UnitType::Point),
          Zero,
          Zero});
    } else if (operation == "rotateX") {
      auto radians = toRadians(parameters);
      if (!radians.has_value()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Rotate,
          ValueUnit(*radians, UnitType::Point),
          Zero,
          Zero});
    } else if (operation == "rotateY") {
      auto radians = toRadians(parameters);
      if (!radians.has_value()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Rotate,
          Zero,
          ValueUnit(*radians, UnitType::Point),
          Zero});
    } else if (operation == "rotateZ" || operation == "rotate") {
      auto radians = toRadians(parameters);
      if (!radians.has_value()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Rotate,
          Zero,
          Zero,
          ValueUnit(*radians, UnitType::Point)});
    } else if (operation == "scale") {
      if (!parameters.hasType<Float>()) {
        result = {};
        return;
      }

      auto number = ValueUnit((Float)parameters, UnitType::Point);
      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Scale, number, number, number});
    } else if (operation == "scaleX") {
      if (!parameters.hasType<Float>()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Scale,
          ValueUnit((Float)parameters, UnitType::Point),
          One,
          One});
    } else if (operation == "scaleY") {
      if (!parameters.hasType<Float>()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Scale,
          One,
          ValueUnit((Float)parameters, UnitType::Point),
          One});
    } else if (operation == "scaleZ") {
      if (!parameters.hasType<Float>()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Scale,
          One,
          One,
          ValueUnit((Float)parameters, UnitType::Point)});
    } else if (operation == "translate") {
      if (!parameters.hasType<std::vector<RawValue>>()) {
        result = {};
        return;
      }

      auto numbers = (std::vector<RawValue>)parameters;
      if (numbers.size() != 2) {
        result = {};
        return;
      }

      auto valueX = toValueUnit(numbers[0]);
      if (!valueX) {
        result = {};
        return;
      }

      auto valueY = toValueUnit(numbers[1]);
      if (!valueY) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Translate, valueX, valueY, Zero});
    } else if (operation == "translateX") {
      auto valueX = toValueUnit(parameters);
      if (!valueX) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Translate, valueX, Zero, Zero});
    } else if (operation == "translateY") {
      auto valueY = toValueUnit(parameters);
      if (!valueY) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Translate, Zero, valueY, Zero});
    } else if (operation == "skewX") {
      auto radians = toRadians(parameters);
      if (!radians.has_value()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Skew,
          ValueUnit(*radians, UnitType::Point),
          Zero,
          Zero});
    } else if (operation == "skewY") {
      auto radians = toRadians(parameters);
      if (!radians.has_value()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(TransformOperation{
          TransformOperationType::Skew,
          Zero,
          ValueUnit(*radians, UnitType::Point),
          Zero});
    }
  }

  result = transformMatrix;
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    TransformOrigin& result) {
  if (!value.hasType<std::vector<RawValue>>()) {
    result = {};
    return;
  }

  auto origins = (std::vector<RawValue>)value;
  if (origins.size() != 3) {
    result = {};
    return;
  }

  TransformOrigin transformOrigin;

  for (size_t i = 0; i < 2; i++) {
    auto origin = toValueUnit(origins[i]);
    if (!origin) {
      result = {};
      return;
    }

    transformOrigin.xy[i] = origin;
  }

  if (!origins[2].hasType<Float>()) {
    result = {};
    return;
  }
  transformOrigin.z = (Float)origins[2];

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

inline std::string toString(const PointerEventsMode& value) {
  switch (value) {
    case PointerEventsMode::Auto:
      return "auto";
    case PointerEventsMode::None:
      return "none";
    case PointerEventsMode::BoxNone:
      return "box-none";
    case PointerEventsMode::BoxOnly:
      return "box-only";
  }
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
    std::vector<ColorStop> colorStops;
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

          if (positionIt != stopMap.end() && colorIt != stopMap.end()) {
            ColorStop colorStop;
            if (positionIt->second.hasValue()) {
              auto valueUnit = toValueUnit(positionIt->second);
              if (!valueUnit) {
                result = {};
                return;
              }
              colorStop.position = valueUnit;
            }
            if (colorIt->second.hasValue()) {
              fromRawValue(
                  context.contextContainer,
                  context.surfaceId,
                  colorIt->second,
                  colorStop.color);
            }
            colorStops.push_back(colorStop);
          }
        }
      }
    }

    if (type == "linear-gradient") {
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

      if (!colorStops.empty()) {
        linearGradient.colorStops = colorStops;
      }

      backgroundImage.emplace_back(std::move(linearGradient));
    } else if (type == "radial-gradient") {
      RadialGradient radialGradient;
      auto shapeIt = rawBackgroundImageMap.find("shape");
      if (shapeIt != rawBackgroundImageMap.end() &&
          shapeIt->second.hasType<std::string>()) {
        auto shape = (std::string)(shapeIt->second);
        radialGradient.shape = shape == "circle" ? RadialGradientShape::Circle
                                                 : RadialGradientShape::Ellipse;
      }

      auto sizeIt = rawBackgroundImageMap.find("size");
      if (sizeIt != rawBackgroundImageMap.end()) {
        if (sizeIt->second.hasType<std::string>()) {
          auto sizeStr = (std::string)(sizeIt->second);
          if (sizeStr == "closest-side") {
            radialGradient.size.value =
                RadialGradientSize::SizeKeyword::ClosestSide;
          } else if (sizeStr == "farthest-side") {
            radialGradient.size.value =
                RadialGradientSize::SizeKeyword::FarthestSide;
          } else if (sizeStr == "closest-corner") {
            radialGradient.size.value =
                RadialGradientSize::SizeKeyword::ClosestCorner;
          } else if (sizeStr == "farthest-corner") {
            radialGradient.size.value =
                RadialGradientSize::SizeKeyword::FarthestCorner;
          }
        } else if (sizeIt->second
                       .hasType<std::unordered_map<std::string, RawValue>>()) {
          auto sizeMap = static_cast<std::unordered_map<std::string, RawValue>>(
              sizeIt->second);
          auto xIt = sizeMap.find("x");
          auto yIt = sizeMap.find("y");
          if (xIt != sizeMap.end() && yIt != sizeMap.end()) {
            RadialGradientSize sizeObj;
            sizeObj.value = RadialGradientSize::Dimensions{
                toValueUnit(xIt->second), toValueUnit(yIt->second)};
            radialGradient.size = sizeObj;
          }
        }

        auto positionIt = rawBackgroundImageMap.find("position");
        if (positionIt != rawBackgroundImageMap.end() &&
            positionIt->second
                .hasType<std::unordered_map<std::string, RawValue>>()) {
          auto positionMap =
              static_cast<std::unordered_map<std::string, RawValue>>(
                  positionIt->second);

          auto topIt = positionMap.find("top");
          auto bottomIt = positionMap.find("bottom");
          auto leftIt = positionMap.find("left");
          auto rightIt = positionMap.find("right");

          if (topIt != positionMap.end()) {
            auto topValue = toValueUnit(topIt->second);
            radialGradient.position.top = topValue;
          } else if (bottomIt != positionMap.end()) {
            auto bottomValue = toValueUnit(bottomIt->second);
            radialGradient.position.bottom = bottomValue;
          }

          if (leftIt != positionMap.end()) {
            auto leftValue = toValueUnit(leftIt->second);
            radialGradient.position.left = leftValue;
          } else if (rightIt != positionMap.end()) {
            auto rightValue = toValueUnit(rightIt->second);
            radialGradient.position.right = rightValue;
          }
        }
      }

      if (!colorStops.empty()) {
        radialGradient.colorStops = colorStops;
      }

      backgroundImage.emplace_back(std::move(radialGradient));
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

inline std::string toString(const std::array<Float, 16>& m) {
  std::string result;
  result += "[ " + std::to_string(m[0]) + " " + std::to_string(m[1]) + " " +
      std::to_string(m[2]) + " " + std::to_string(m[3]) + " ]\n";
  result += "[ " + std::to_string(m[4]) + " " + std::to_string(m[5]) + " " +
      std::to_string(m[6]) + " " + std::to_string(m[7]) + " ]\n";
  result += "[ " + std::to_string(m[8]) + " " + std::to_string(m[9]) + " " +
      std::to_string(m[10]) + " " + std::to_string(m[11]) + " ]\n";
  result += "[ " + std::to_string(m[12]) + " " + std::to_string(m[13]) + " " +
      std::to_string(m[14]) + " " + std::to_string(m[15]) + " ]";
  return result;
}

inline std::string toString(const Transform& transform) {
  std::string result = "[";
  bool first = true;

  for (const auto& operation : transform.operations) {
    if (!first) {
      result += ", ";
    }
    first = false;

    switch (operation.type) {
      case TransformOperationType::Perspective: {
        result +=
            "{\"perspective\": " + std::to_string(operation.x.value) + "}";
        break;
      }
      case TransformOperationType::Rotate: {
        if (operation.x.value != 0 && operation.y.value == 0 &&
            operation.z.value == 0) {
          result +=
              R"({"rotateX": ")" + std::to_string(operation.x.value) + "rad\"}";
        } else if (
            operation.x.value == 0 && operation.y.value != 0 &&
            operation.z.value == 0) {
          result +=
              R"({"rotateY": ")" + std::to_string(operation.y.value) + "rad\"}";
        } else if (
            operation.x.value == 0 && operation.y.value == 0 &&
            operation.z.value != 0) {
          result +=
              R"({"rotateZ": ")" + std::to_string(operation.z.value) + "rad\"}";
        }
        break;
      }
      case TransformOperationType::Scale: {
        if (operation.x.value == operation.y.value &&
            operation.x.value == operation.z.value) {
          result += "{\"scale\": " + std::to_string(operation.x.value) + "}";
        } else if (operation.y.value == 1 && operation.z.value == 1) {
          result += "{\"scaleX\": " + std::to_string(operation.x.value) + "}";
        } else if (operation.x.value == 1 && operation.z.value == 1) {
          result += "{\"scaleY\": " + std::to_string(operation.y.value) + "}";
        } else if (operation.x.value == 1 && operation.y.value == 1) {
          result += "{\"scaleZ\": " + std::to_string(operation.z.value) + "}";
        }
        break;
      }
      case TransformOperationType::Translate: {
        if (operation.x.value != 0 && operation.y.value != 0 &&
            operation.z.value == 0) {
          result += "{\"translate\": [";
          result += std::to_string(operation.x.value) + ", " +
              std::to_string(operation.y.value);
          result += "]}";
        } else if (operation.x.value != 0 && operation.y.value == 0) {
          result +=
              "{\"translateX\": " + std::to_string(operation.x.value) + "}";
        } else if (operation.x.value == 0 && operation.y.value != 0) {
          result +=
              "{\"translateY\": " + std::to_string(operation.y.value) + "}";
        }
        break;
      }
      case TransformOperationType::Skew: {
        if (operation.x.value != 0 && operation.y.value == 0) {
          result +=
              R"({"skewX": ")" + std::to_string(operation.x.value) + "rad\"}";
        } else if (operation.x.value == 0 && operation.y.value != 0) {
          result +=
              R"({"skewY": ")" + std::to_string(operation.y.value) + "rad\"}";
        }
        break;
      }
      case TransformOperationType::Arbitrary: {
        result += "{\"matrix\": " + toString(transform.matrix) + "}";
        break;
      }
      case TransformOperationType::Identity: {
        result += "{\"identity\": true}";
        break;
      }
    }
  }

  result += "]";
  return result;
}

} // namespace facebook::react
