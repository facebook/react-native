/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <react/debug/react_native_expect.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/view/conversions/YogaLayout.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSRatio.h>
#include <react/renderer/css/CSSValueParser.h>
#include <string>

namespace facebook::react {

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, yoga::Direction &result)
{
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

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, yoga::FlexDirection &result)
{
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

inline void fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, yoga::BoxSizing &result)
{
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

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, yoga::Justify &result)
{
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

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, yoga::Align &result)
{
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

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, yoga::PositionType &result)
{
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

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, yoga::Wrap &result)
{
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

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, yoga::Overflow &result)
{
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

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, yoga::Display &result)
{
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

inline void fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, yoga::Style::SizeLength &result)
{
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
        result = yoga::StyleSizeLength::percent(std::get<CSSPercentage>(parsed).value);
        return;
      } else if (std::holds_alternative<CSSNumber>(parsed)) {
        result = yoga::StyleSizeLength::points(std::get<CSSNumber>(parsed).value);
        return;
      }
    }
  }
  result = yoga::StyleSizeLength::undefined();
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, yoga::Style::Length &result)
{
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
        result = yoga::StyleLength::percent(std::get<CSSPercentage>(parsed).value);
        return;
      } else if (std::holds_alternative<CSSNumber>(parsed)) {
        result = yoga::StyleLength::points(std::get<CSSNumber>(parsed).value);
        return;
      }
    }
  }
  result = yoga::StyleLength::undefined();
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, YGValue &result)
{
  yoga::Style::Length length{};
  fromRawValue(context, value, length);
  result = (YGValue)length;
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, yoga::FloatOptional &result)
{
  result = value.hasType<float>() ? yoga::FloatOptional((float)value) : yoga::FloatOptional();
}

inline yoga::FloatOptional convertAspectRatio(const PropsParserContext &context, const RawValue &value)
{
  if (value.hasType<float>()) {
    return yoga::FloatOptional((float)value);
  }
  if (ReactNativeFeatureFlags::enableNativeCSSParsing() && value.hasType<std::string>()) {
    auto ratio = parseCSSProperty<CSSRatio>((std::string)value);
    if (std::holds_alternative<CSSRatio>(ratio)) {
      auto r = std::get<CSSRatio>(ratio);
      if (!r.isDegenerate()) {
        return yoga::FloatOptional(r.numerator / r.denominator);
      }
    }
  }
  return yoga::FloatOptional();
}

// Nearly this entire file can be deleted when iterator-style Prop parsing
// ships fully for View

static inline yoga::Style
convertRawProp(const PropsParserContext &context, const RawProps &rawProps, const yoga::Style &sourceValue)
{
  yoga::Style yogaStyle{};

  yogaStyle.setDirection(
      convertRawProp(context, rawProps, "direction", sourceValue.direction(), yogaStyle.direction()));

  yogaStyle.setFlexDirection(
      convertRawProp(context, rawProps, "flexDirection", sourceValue.flexDirection(), yogaStyle.flexDirection()));

  yogaStyle.setJustifyContent(
      convertRawProp(context, rawProps, "justifyContent", sourceValue.justifyContent(), yogaStyle.justifyContent()));

  yogaStyle.setAlignContent(
      convertRawProp(context, rawProps, "alignContent", sourceValue.alignContent(), yogaStyle.alignContent()));

  yogaStyle.setAlignItems(
      convertRawProp(context, rawProps, "alignItems", sourceValue.alignItems(), yogaStyle.alignItems()));

  yogaStyle.setAlignSelf(
      convertRawProp(context, rawProps, "alignSelf", sourceValue.alignSelf(), yogaStyle.alignSelf()));

  yogaStyle.setPositionType(
      convertRawProp(context, rawProps, "position", sourceValue.positionType(), yogaStyle.positionType()));

  yogaStyle.setFlexWrap(convertRawProp(context, rawProps, "flexWrap", sourceValue.flexWrap(), yogaStyle.flexWrap()));

  yogaStyle.setOverflow(convertRawProp(context, rawProps, "overflow", sourceValue.overflow(), yogaStyle.overflow()));

  yogaStyle.setDisplay(convertRawProp(context, rawProps, "display", sourceValue.display(), yogaStyle.display()));

  yogaStyle.setFlex(convertRawProp(context, rawProps, "flex", sourceValue.flex(), yogaStyle.flex()));

  yogaStyle.setFlexGrow(convertRawProp(context, rawProps, "flexGrow", sourceValue.flexGrow(), yogaStyle.flexGrow()));

  yogaStyle.setFlexShrink(
      convertRawProp(context, rawProps, "flexShrink", sourceValue.flexShrink(), yogaStyle.flexShrink()));

  yogaStyle.setFlexBasis(
      convertRawProp(context, rawProps, "flexBasis", sourceValue.flexBasis(), yogaStyle.flexBasis()));

  yogaStyle.setMargin(
      yoga::Edge::Left,
      convertRawProp(
          context, rawProps, "marginLeft", sourceValue.margin(yoga::Edge::Left), yogaStyle.margin(yoga::Edge::Left)));

  yogaStyle.setMargin(
      yoga::Edge::Top,
      convertRawProp(
          context, rawProps, "marginTop", sourceValue.margin(yoga::Edge::Top), yogaStyle.margin(yoga::Edge::Top)));

  yogaStyle.setMargin(
      yoga::Edge::Right,
      convertRawProp(
          context,
          rawProps,
          "marginRight",
          sourceValue.margin(yoga::Edge::Right),
          yogaStyle.margin(yoga::Edge::Right)));

  yogaStyle.setMargin(
      yoga::Edge::Bottom,
      convertRawProp(
          context,
          rawProps,
          "marginBottom",
          sourceValue.margin(yoga::Edge::Bottom),
          yogaStyle.margin(yoga::Edge::Bottom)));

  yogaStyle.setMargin(
      yoga::Edge::Start,
      convertRawProp(
          context,
          rawProps,
          "marginStart",
          sourceValue.margin(yoga::Edge::Start),
          yogaStyle.margin(yoga::Edge::Start)));

  yogaStyle.setMargin(
      yoga::Edge::End,
      convertRawProp(
          context, rawProps, "marginEnd", sourceValue.margin(yoga::Edge::End), yogaStyle.margin(yoga::Edge::End)));

  yogaStyle.setMargin(
      yoga::Edge::Horizontal,
      convertRawProp(
          context,
          rawProps,
          "marginHorizontal",
          sourceValue.margin(yoga::Edge::Horizontal),
          yogaStyle.margin(yoga::Edge::Horizontal)));

  yogaStyle.setMargin(
      yoga::Edge::Vertical,
      convertRawProp(
          context,
          rawProps,
          "marginVertical",
          sourceValue.margin(yoga::Edge::Vertical),
          yogaStyle.margin(yoga::Edge::Vertical)));

  yogaStyle.setMargin(
      yoga::Edge::All,
      convertRawProp(
          context, rawProps, "margin", sourceValue.margin(yoga::Edge::All), yogaStyle.margin(yoga::Edge::All)));

  yogaStyle.setPosition(
      yoga::Edge::Left,
      convertRawProp(
          context, rawProps, "left", sourceValue.position(yoga::Edge::Left), yogaStyle.position(yoga::Edge::Left)));

  yogaStyle.setPosition(
      yoga::Edge::Top,
      convertRawProp(
          context, rawProps, "top", sourceValue.position(yoga::Edge::Top), yogaStyle.position(yoga::Edge::Top)));

  yogaStyle.setPosition(
      yoga::Edge::Right,
      convertRawProp(
          context, rawProps, "right", sourceValue.position(yoga::Edge::Right), yogaStyle.position(yoga::Edge::Right)));

  yogaStyle.setPosition(
      yoga::Edge::Bottom,
      convertRawProp(
          context,
          rawProps,
          "bottom",
          sourceValue.position(yoga::Edge::Bottom),
          yogaStyle.position(yoga::Edge::Bottom)));

  yogaStyle.setPosition(
      yoga::Edge::Start,
      convertRawProp(
          context, rawProps, "start", sourceValue.position(yoga::Edge::Start), yogaStyle.position(yoga::Edge::Start)));

  yogaStyle.setPosition(
      yoga::Edge::End,
      convertRawProp(
          context, rawProps, "end", sourceValue.position(yoga::Edge::End), yogaStyle.position(yoga::Edge::End)));

  yogaStyle.setPosition(
      yoga::Edge::Horizontal,
      convertRawProp(
          context,
          rawProps,
          "insetInline",
          sourceValue.position(yoga::Edge::Horizontal),
          yogaStyle.position(yoga::Edge::Horizontal)));

  yogaStyle.setPosition(
      yoga::Edge::Vertical,
      convertRawProp(
          context,
          rawProps,
          "insetBlock",
          sourceValue.position(yoga::Edge::Vertical),
          yogaStyle.position(yoga::Edge::Vertical)));

  yogaStyle.setPosition(
      yoga::Edge::All,
      convertRawProp(
          context, rawProps, "inset", sourceValue.position(yoga::Edge::All), yogaStyle.position(yoga::Edge::All)));

  yogaStyle.setPadding(
      yoga::Edge::Left,
      convertRawProp(
          context,
          rawProps,
          "paddingLeft",
          sourceValue.padding(yoga::Edge::Left),
          yogaStyle.padding(yoga::Edge::Left)));

  yogaStyle.setPadding(
      yoga::Edge::Top,
      convertRawProp(
          context, rawProps, "paddingTop", sourceValue.padding(yoga::Edge::Top), yogaStyle.padding(yoga::Edge::Top)));

  yogaStyle.setPadding(
      yoga::Edge::Right,
      convertRawProp(
          context,
          rawProps,
          "paddingRight",
          sourceValue.padding(yoga::Edge::Right),
          yogaStyle.padding(yoga::Edge::Right)));

  yogaStyle.setPadding(
      yoga::Edge::Bottom,
      convertRawProp(
          context,
          rawProps,
          "paddingBottom",
          sourceValue.padding(yoga::Edge::Bottom),
          yogaStyle.padding(yoga::Edge::Bottom)));

  yogaStyle.setPadding(
      yoga::Edge::Start,
      convertRawProp(
          context,
          rawProps,
          "paddingStart",
          sourceValue.padding(yoga::Edge::Start),
          yogaStyle.padding(yoga::Edge::Start)));

  yogaStyle.setPadding(
      yoga::Edge::End,
      convertRawProp(
          context, rawProps, "paddingEnd", sourceValue.padding(yoga::Edge::End), yogaStyle.padding(yoga::Edge::End)));

  yogaStyle.setPadding(
      yoga::Edge::Horizontal,
      convertRawProp(
          context,
          rawProps,
          "paddingHorizontal",
          sourceValue.padding(yoga::Edge::Horizontal),
          yogaStyle.padding(yoga::Edge::Horizontal)));

  yogaStyle.setPadding(
      yoga::Edge::Vertical,
      convertRawProp(
          context,
          rawProps,
          "paddingVertical",
          sourceValue.padding(yoga::Edge::Vertical),
          yogaStyle.padding(yoga::Edge::Vertical)));

  yogaStyle.setPadding(
      yoga::Edge::All,
      convertRawProp(
          context, rawProps, "padding", sourceValue.padding(yoga::Edge::All), yogaStyle.padding(yoga::Edge::All)));

  yogaStyle.setGap(
      yoga::Gutter::Row,
      convertRawProp(
          context, rawProps, "rowGap", sourceValue.gap(yoga::Gutter::Row), yogaStyle.gap(yoga::Gutter::Row)));

  yogaStyle.setGap(
      yoga::Gutter::Column,
      convertRawProp(
          context, rawProps, "columnGap", sourceValue.gap(yoga::Gutter::Column), yogaStyle.gap(yoga::Gutter::Column)));

  yogaStyle.setGap(
      yoga::Gutter::All,
      convertRawProp(context, rawProps, "gap", sourceValue.gap(yoga::Gutter::All), yogaStyle.gap(yoga::Gutter::All)));

  yogaStyle.setBorder(
      yoga::Edge::Left,
      convertRawProp(
          context,
          rawProps,
          "borderLeftWidth",
          sourceValue.border(yoga::Edge::Left),
          yogaStyle.border(yoga::Edge::Left)));

  yogaStyle.setBorder(
      yoga::Edge::Top,
      convertRawProp(
          context, rawProps, "borderTopWidth", sourceValue.border(yoga::Edge::Top), yogaStyle.border(yoga::Edge::Top)));

  yogaStyle.setBorder(
      yoga::Edge::Right,
      convertRawProp(
          context,
          rawProps,
          "borderRightWidth",
          sourceValue.border(yoga::Edge::Right),
          yogaStyle.border(yoga::Edge::Right)));

  yogaStyle.setBorder(
      yoga::Edge::Bottom,
      convertRawProp(
          context,
          rawProps,
          "borderBottomWidth",
          sourceValue.border(yoga::Edge::Bottom),
          yogaStyle.border(yoga::Edge::Bottom)));

  yogaStyle.setBorder(
      yoga::Edge::Start,
      convertRawProp(
          context,
          rawProps,
          "borderStartWidth",
          sourceValue.border(yoga::Edge::Start),
          yogaStyle.border(yoga::Edge::Start)));

  yogaStyle.setBorder(
      yoga::Edge::End,
      convertRawProp(
          context, rawProps, "borderEndWidth", sourceValue.border(yoga::Edge::End), yogaStyle.border(yoga::Edge::End)));

  yogaStyle.setBorder(
      yoga::Edge::Horizontal,
      convertRawProp(
          context,
          rawProps,
          "borderHorizontalWidth",
          sourceValue.border(yoga::Edge::Horizontal),
          yogaStyle.border(yoga::Edge::Horizontal)));

  yogaStyle.setBorder(
      yoga::Edge::Vertical,
      convertRawProp(
          context,
          rawProps,
          "borderVerticalWidth",
          sourceValue.border(yoga::Edge::Vertical),
          yogaStyle.border(yoga::Edge::Vertical)));

  yogaStyle.setBorder(
      yoga::Edge::All,
      convertRawProp(
          context, rawProps, "borderWidth", sourceValue.border(yoga::Edge::All), yogaStyle.border(yoga::Edge::All)));

  yogaStyle.setDimension(
      yoga::Dimension::Width,
      convertRawProp(context, rawProps, "width", sourceValue.dimension(yoga::Dimension::Width), {}));

  yogaStyle.setDimension(
      yoga::Dimension::Height,
      convertRawProp(context, rawProps, "height", sourceValue.dimension(yoga::Dimension::Height), {}));

  yogaStyle.setMinDimension(
      yoga::Dimension::Width,
      convertRawProp(context, rawProps, "minWidth", sourceValue.minDimension(yoga::Dimension::Width), {}));

  yogaStyle.setMinDimension(
      yoga::Dimension::Height,
      convertRawProp(context, rawProps, "minHeight", sourceValue.minDimension(yoga::Dimension::Height), {}));

  yogaStyle.setMaxDimension(
      yoga::Dimension::Width,
      convertRawProp(context, rawProps, "maxWidth", sourceValue.maxDimension(yoga::Dimension::Width), {}));

  yogaStyle.setMaxDimension(
      yoga::Dimension::Height,
      convertRawProp(context, rawProps, "maxHeight", sourceValue.maxDimension(yoga::Dimension::Height), {}));

  {
    const auto *rawValue = rawProps.at("aspectRatio", nullptr, nullptr);
    if (rawValue != nullptr) {
      yogaStyle.setAspectRatio(rawValue->hasValue() ? convertAspectRatio(context, *rawValue) : yogaStyle.aspectRatio());
    }
  }

  yogaStyle.setBoxSizing(
      convertRawProp(context, rawProps, "boxSizing", sourceValue.boxSizing(), yogaStyle.boxSizing()));

  return yogaStyle;
}

} // namespace facebook::react
