/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YogaStylableProps.h"

#include <react/renderer/components/view/conversions.h>
#include <react/renderer/components/view/propsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>
#include <react/utils/CoreFeatures.h>
#include <yoga/Yoga.h>
#include <unordered_set>

#include "conversions.h"

namespace facebook::react {

YogaStylableProps::YogaStylableProps(
    const PropsParserContext& context,
    const YogaStylableProps& sourceProps,
    const RawProps& rawProps)
    : Props() {
  initialize(context, sourceProps, rawProps);

  yogaStyle = CoreFeatures::enablePropIteratorSetter
      ? sourceProps.yogaStyle
      : convertRawProp(context, rawProps, sourceProps.yogaStyle);

  if (!CoreFeatures::enablePropIteratorSetter) {
    convertRawPropAliases(context, sourceProps, rawProps);
  }
};

template <typename T>
static inline T const getFieldValue(
    const PropsParserContext& context,
    const RawValue& value,
    T const defaultValue) {
  if (value.hasValue()) {
    T res;
    fromRawValue(context, value, res);
    return res;
  }

  return defaultValue;
}

#define REBUILD_FIELD_SWITCH_CASE2(field, fieldName)                       \
  case CONSTEXPR_RAW_PROPS_KEY_HASH(fieldName): {                          \
    yogaStyle.field() = getFieldValue(context, value, ygDefaults.field()); \
    return;                                                                \
  }

// @lint-ignore CLANGTIDY cppcoreguidelines-macro-usage
#define REBUILD_FIELD_SWITCH_CASE_YSP(field) \
  REBUILD_FIELD_SWITCH_CASE2(field, #field)

#define REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(field, setter, index, fieldName) \
  case CONSTEXPR_RAW_PROPS_KEY_HASH(fieldName): {                             \
    yogaStyle.setter(                                                         \
        index, getFieldValue(context, value, ygDefaults.field(index)));       \
    return;                                                                   \
  }

#define REBUILD_FIELD_YG_DIMENSION(field, setter, widthStr, heightStr) \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                \
      field, setter, yoga::Dimension::Width, widthStr);                \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                \
      field, setter, yoga::Dimension::Height, heightStr);

#define REBUILD_FIELD_YG_GUTTER(                          \
    field, setter, rowGapStr, columnGapStr, gapStr)       \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                   \
      field, setter, yoga::Gutter::Row, rowGapStr);       \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                   \
      field, setter, yoga::Gutter::Column, columnGapStr); \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                   \
      field, setter, yoga::Gutter::All, gapStr);

#define REBUILD_FIELD_YG_EDGES(field, setter, prefix, suffix)       \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                             \
      field, setter, YGEdgeLeft, prefix "Left" suffix);             \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                             \
      field, setter, YGEdgeTop, prefix "Top" suffix);               \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                             \
      field, setter, YGEdgeRight, prefix "Right" suffix);           \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                             \
      field, setter, YGEdgeBottom, prefix "Bottom" suffix);         \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                             \
      field, setter, YGEdgeStart, prefix "Start" suffix);           \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                             \
      field, setter, YGEdgeEnd, prefix "End" suffix);               \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                             \
      field, setter, YGEdgeHorizontal, prefix "Horizontal" suffix); \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                             \
      field, setter, YGEdgeVertical, prefix "Vertical" suffix);     \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                             \
      field, setter, YGEdgeAll, prefix "" suffix);

#define REBUILD_FIELD_YG_EDGES_POSITION()                      \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                        \
      position, setPosition, YGEdgeLeft, "left");              \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                        \
      position, setPosition, YGEdgeTop, "top");                \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                        \
      position, setPosition, YGEdgeRight, "right");            \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                        \
      position, setPosition, YGEdgeBottom, "bottom");          \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                        \
      position, setPosition, YGEdgeStart, "start");            \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                        \
      position, setPosition, YGEdgeEnd, "end");                \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                        \
      position, setPosition, YGEdgeHorizontal, "insetInline"); \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                        \
      position, setPosition, YGEdgeVertical, "insetBlock");    \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                        \
      position, setPosition, YGEdgeAll, "inset");

void YogaStylableProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  static const auto ygDefaults = yoga::Style{};
  static const auto defaults = YogaStylableProps{};

  Props::setProp(context, hash, propName, value);

  switch (hash) {
    REBUILD_FIELD_SWITCH_CASE_YSP(direction);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexDirection);
    REBUILD_FIELD_SWITCH_CASE_YSP(justifyContent);
    REBUILD_FIELD_SWITCH_CASE_YSP(alignContent);
    REBUILD_FIELD_SWITCH_CASE_YSP(alignItems);
    REBUILD_FIELD_SWITCH_CASE_YSP(alignSelf);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexWrap);
    REBUILD_FIELD_SWITCH_CASE_YSP(overflow);
    REBUILD_FIELD_SWITCH_CASE_YSP(display);
    REBUILD_FIELD_SWITCH_CASE_YSP(flex);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexGrow);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexShrink);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexBasis);
    REBUILD_FIELD_SWITCH_CASE2(positionType, "position");
    REBUILD_FIELD_YG_GUTTER(gap, setGap, "rowGap", "columnGap", "gap");
    REBUILD_FIELD_SWITCH_CASE_YSP(aspectRatio);
    REBUILD_FIELD_YG_DIMENSION(dimension, setDimension, "width", "height");
    REBUILD_FIELD_YG_DIMENSION(
        minDimension, setMinDimension, "minWidth", "minHeight");
    REBUILD_FIELD_YG_DIMENSION(
        maxDimension, setMaxDimension, "maxWidth", "maxHeight");
    REBUILD_FIELD_YG_EDGES_POSITION();
    REBUILD_FIELD_YG_EDGES(margin, setMargin, "margin", "");
    REBUILD_FIELD_YG_EDGES(padding, setPadding, "padding", "");
    REBUILD_FIELD_YG_EDGES(border, setBorder, "border", "Width");

    // Aliases
    RAW_SET_PROP_SWITCH_CASE(insetBlockEnd, "insetBlockEnd");
    RAW_SET_PROP_SWITCH_CASE(insetBlockStart, "insetBlockStart");
    RAW_SET_PROP_SWITCH_CASE(insetInlineEnd, "insetInlineEnd");
    RAW_SET_PROP_SWITCH_CASE(insetInlineStart, "insetInlineStart");
    RAW_SET_PROP_SWITCH_CASE(marginInline, "marginInline");
    RAW_SET_PROP_SWITCH_CASE(marginInlineStart, "marginInlineStart");
    RAW_SET_PROP_SWITCH_CASE(marginInlineEnd, "marginInlineEnd");
    RAW_SET_PROP_SWITCH_CASE(marginBlock, "marginBlock");
    RAW_SET_PROP_SWITCH_CASE(marginBlockStart, "marginBlockStart");
    RAW_SET_PROP_SWITCH_CASE(marginBlockEnd, "marginBlockEnd");
    RAW_SET_PROP_SWITCH_CASE(paddingInline, "paddingInline");
    RAW_SET_PROP_SWITCH_CASE(paddingInlineStart, "paddingInlineStart");
    RAW_SET_PROP_SWITCH_CASE(paddingInlineEnd, "paddingInlineEnd");
    RAW_SET_PROP_SWITCH_CASE(paddingBlock, "paddingBlock");
    RAW_SET_PROP_SWITCH_CASE(paddingBlockStart, "paddingBlockStart");
    RAW_SET_PROP_SWITCH_CASE(paddingBlockEnd, "paddingBlockEnd");
  }
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList YogaStylableProps::getDebugProps() const {
  const auto defaultYogaStyle = yoga::Style{};
  return {
      debugStringConvertibleItem(
          "direction", yogaStyle.direction(), defaultYogaStyle.direction()),
      debugStringConvertibleItem(
          "flexDirection",
          yogaStyle.flexDirection(),
          defaultYogaStyle.flexDirection()),
      debugStringConvertibleItem(
          "justifyContent",
          yogaStyle.justifyContent(),
          defaultYogaStyle.justifyContent()),
      debugStringConvertibleItem(
          "alignContent",
          yogaStyle.alignContent(),
          defaultYogaStyle.alignContent()),
      debugStringConvertibleItem(
          "alignItems", yogaStyle.alignItems(), defaultYogaStyle.alignItems()),
      debugStringConvertibleItem(
          "alignSelf", yogaStyle.alignSelf(), defaultYogaStyle.alignSelf()),
      debugStringConvertibleItem(
          "positionType",
          yogaStyle.positionType(),
          defaultYogaStyle.positionType()),
      debugStringConvertibleItem(
          "flexWrap", yogaStyle.flexWrap(), defaultYogaStyle.flexWrap()),
      debugStringConvertibleItem(
          "overflow", yogaStyle.overflow(), defaultYogaStyle.overflow()),
      debugStringConvertibleItem(
          "display", yogaStyle.display(), defaultYogaStyle.display()),
      debugStringConvertibleItem(
          "flex", yogaStyle.flex(), defaultYogaStyle.flex()),
      debugStringConvertibleItem(
          "flexGrow", yogaStyle.flexGrow(), defaultYogaStyle.flexGrow()),
      debugStringConvertibleItem(
          "rowGap",
          yogaStyle.gap(yoga::Gutter::Row),
          defaultYogaStyle.gap(yoga::Gutter::Row)),
      debugStringConvertibleItem(
          "columnGap",
          yogaStyle.gap(yoga::Gutter::Column),
          defaultYogaStyle.gap(yoga::Gutter::Column)),
      debugStringConvertibleItem(
          "gap",
          yogaStyle.gap(yoga::Gutter::All),
          defaultYogaStyle.gap(yoga::Gutter::All)),
      debugStringConvertibleItem(
          "flexShrink", yogaStyle.flexShrink(), defaultYogaStyle.flexShrink()),
      debugStringConvertibleItem(
          "flexBasis", yogaStyle.flexBasis(), defaultYogaStyle.flexBasis()),
      debugStringConvertibleItem(
          "marginLeft",
          yogaStyle.margin(YGEdgeLeft),
          defaultYogaStyle.margin(YGEdgeLeft)),
      debugStringConvertibleItem(
          "marginTop",
          yogaStyle.margin(YGEdgeTop),
          defaultYogaStyle.margin(YGEdgeTop)),
      debugStringConvertibleItem(
          "marginRight",
          yogaStyle.margin(YGEdgeRight),
          defaultYogaStyle.margin(YGEdgeRight)),
      debugStringConvertibleItem(
          "marginBottom",
          yogaStyle.margin(YGEdgeBottom),
          defaultYogaStyle.margin(YGEdgeBottom)),
      debugStringConvertibleItem(
          "marginStart",
          yogaStyle.margin(YGEdgeStart),
          defaultYogaStyle.margin(YGEdgeStart)),
      debugStringConvertibleItem(
          "marginEnd",
          yogaStyle.margin(YGEdgeEnd),
          defaultYogaStyle.margin(YGEdgeEnd)),
      debugStringConvertibleItem(
          "marginHorizontal",
          yogaStyle.margin(YGEdgeHorizontal),
          defaultYogaStyle.margin(YGEdgeHorizontal)),
      debugStringConvertibleItem(
          "marginVertical",
          yogaStyle.margin(YGEdgeVertical),
          defaultYogaStyle.margin(YGEdgeVertical)),
      debugStringConvertibleItem(
          "margin",
          yogaStyle.margin(YGEdgeAll),
          defaultYogaStyle.margin(YGEdgeAll)),
      debugStringConvertibleItem(
          "left",
          yogaStyle.position(YGEdgeLeft),
          defaultYogaStyle.position(YGEdgeLeft)),
      debugStringConvertibleItem(
          "top",
          yogaStyle.position(YGEdgeTop),
          defaultYogaStyle.position(YGEdgeTop)),
      debugStringConvertibleItem(
          "right",
          yogaStyle.position(YGEdgeRight),
          defaultYogaStyle.position(YGEdgeRight)),
      debugStringConvertibleItem(
          "bottom",
          yogaStyle.position(YGEdgeBottom),
          defaultYogaStyle.position(YGEdgeBottom)),
      debugStringConvertibleItem(
          "start",
          yogaStyle.position(YGEdgeStart),
          defaultYogaStyle.position(YGEdgeStart)),
      debugStringConvertibleItem(
          "end",
          yogaStyle.position(YGEdgeEnd),
          defaultYogaStyle.position(YGEdgeEnd)),
      debugStringConvertibleItem(
          "inseInline",
          yogaStyle.position(YGEdgeHorizontal),
          defaultYogaStyle.position(YGEdgeHorizontal)),
      debugStringConvertibleItem(
          "insetBlock",
          yogaStyle.position(YGEdgeVertical),
          defaultYogaStyle.position(YGEdgeVertical)),
      debugStringConvertibleItem(
          "inset",
          yogaStyle.position(YGEdgeAll),
          defaultYogaStyle.position(YGEdgeAll)),
      debugStringConvertibleItem(
          "paddingLeft",
          yogaStyle.padding(YGEdgeLeft),
          defaultYogaStyle.padding(YGEdgeLeft)),
      debugStringConvertibleItem(
          "paddingTop",
          yogaStyle.padding(YGEdgeTop),
          defaultYogaStyle.padding(YGEdgeTop)),
      debugStringConvertibleItem(
          "paddingRight",
          yogaStyle.padding(YGEdgeRight),
          defaultYogaStyle.padding(YGEdgeRight)),
      debugStringConvertibleItem(
          "paddingBottom",
          yogaStyle.padding(YGEdgeBottom),
          defaultYogaStyle.padding(YGEdgeBottom)),
      debugStringConvertibleItem(
          "paddingStart",
          yogaStyle.padding(YGEdgeStart),
          defaultYogaStyle.padding(YGEdgeStart)),
      debugStringConvertibleItem(
          "paddingEnd",
          yogaStyle.padding(YGEdgeEnd),
          defaultYogaStyle.padding(YGEdgeEnd)),
      debugStringConvertibleItem(
          "paddingHorizontal",
          yogaStyle.padding(YGEdgeHorizontal),
          defaultYogaStyle.padding(YGEdgeHorizontal)),
      debugStringConvertibleItem(
          "paddingVertical",
          yogaStyle.padding(YGEdgeVertical),
          defaultYogaStyle.padding(YGEdgeVertical)),
      debugStringConvertibleItem(
          "padding",
          yogaStyle.padding(YGEdgeAll),
          defaultYogaStyle.padding(YGEdgeAll)),
      debugStringConvertibleItem(
          "borderLeftWidth",
          yogaStyle.border(YGEdgeLeft),
          defaultYogaStyle.border(YGEdgeLeft)),
      debugStringConvertibleItem(
          "borderTopWidth",
          yogaStyle.border(YGEdgeTop),
          defaultYogaStyle.border(YGEdgeTop)),
      debugStringConvertibleItem(
          "borderRightWidth",
          yogaStyle.border(YGEdgeRight),
          defaultYogaStyle.border(YGEdgeRight)),
      debugStringConvertibleItem(
          "borderBottomWidth",
          yogaStyle.border(YGEdgeBottom),
          defaultYogaStyle.border(YGEdgeBottom)),
      debugStringConvertibleItem(
          "borderStartWidth",
          yogaStyle.border(YGEdgeStart),
          defaultYogaStyle.border(YGEdgeStart)),
      debugStringConvertibleItem(
          "borderEndWidth",
          yogaStyle.border(YGEdgeEnd),
          defaultYogaStyle.border(YGEdgeEnd)),
      debugStringConvertibleItem(
          "borderHorizontalWidth",
          yogaStyle.border(YGEdgeHorizontal),
          defaultYogaStyle.border(YGEdgeHorizontal)),
      debugStringConvertibleItem(
          "borderVerticalWidth",
          yogaStyle.border(YGEdgeVertical),
          defaultYogaStyle.border(YGEdgeVertical)),
      debugStringConvertibleItem(
          "bordeWidth",
          yogaStyle.border(YGEdgeAll),
          defaultYogaStyle.border(YGEdgeAll)),
      debugStringConvertibleItem(
          "width",
          yogaStyle.dimension(yoga::Dimension::Width),
          defaultYogaStyle.dimension(yoga::Dimension::Width)),
      debugStringConvertibleItem(
          "height",
          yogaStyle.dimension(yoga::Dimension::Height),
          defaultYogaStyle.dimension(yoga::Dimension::Height)),
      debugStringConvertibleItem(
          "minWidth",
          yogaStyle.minDimension(yoga::Dimension::Width),
          defaultYogaStyle.minDimension(yoga::Dimension::Width)),
      debugStringConvertibleItem(
          "minHeight",
          yogaStyle.minDimension(yoga::Dimension::Height),
          defaultYogaStyle.minDimension(yoga::Dimension::Height)),
      debugStringConvertibleItem(
          "maxWidth",
          yogaStyle.maxDimension(yoga::Dimension::Width),
          defaultYogaStyle.maxDimension(yoga::Dimension::Width)),
      debugStringConvertibleItem(
          "maxHeight",
          yogaStyle.maxDimension(yoga::Dimension::Height),
          defaultYogaStyle.maxDimension(yoga::Dimension::Height)),
      debugStringConvertibleItem(
          "aspectRatio",
          yogaStyle.aspectRatio(),
          defaultYogaStyle.aspectRatio()),
  };
}
#endif

void YogaStylableProps::convertRawPropAliases(
    const PropsParserContext& context,
    const YogaStylableProps& sourceProps,
    const RawProps& rawProps) {
  insetBlockEnd = convertRawProp(
      context,
      rawProps,
      "insetBlockEnd",
      sourceProps.insetBlockEnd,
      yoga::value::undefined());
  insetBlockStart = convertRawProp(
      context,
      rawProps,
      "insetBlockStart",
      sourceProps.insetBlockStart,
      yoga::value::undefined());
  insetInlineEnd = convertRawProp(
      context,
      rawProps,
      "insetInlineEnd",
      sourceProps.insetInlineEnd,
      yoga::value::undefined());
  insetInlineStart = convertRawProp(
      context,
      rawProps,
      "insetInlineStart",
      sourceProps.insetInlineStart,
      yoga::value::undefined());
  marginInline = convertRawProp(
      context,
      rawProps,
      "marginInline",
      sourceProps.marginInline,
      yoga::value::undefined());
  marginInlineStart = convertRawProp(
      context,
      rawProps,
      "marginInlineStart",
      sourceProps.marginInlineStart,
      yoga::value::undefined());
  marginInlineEnd = convertRawProp(
      context,
      rawProps,
      "marginInlineEnd",
      sourceProps.marginInlineEnd,
      yoga::value::undefined());
  marginBlock = convertRawProp(
      context,
      rawProps,
      "marginBlock",
      sourceProps.marginBlock,
      yoga::value::undefined());
  marginBlockStart = convertRawProp(
      context,
      rawProps,
      "marginBlockStart",
      sourceProps.marginBlockStart,
      yoga::value::undefined());
  marginBlockEnd = convertRawProp(
      context,
      rawProps,
      "marginBlockEnd",
      sourceProps.marginBlockEnd,
      yoga::value::undefined());

  paddingInline = convertRawProp(
      context,
      rawProps,
      "paddingInline",
      sourceProps.paddingInline,
      yoga::value::undefined());
  paddingInlineStart = convertRawProp(
      context,
      rawProps,
      "paddingInlineStart",
      sourceProps.paddingInlineStart,
      yoga::value::undefined());
  paddingInlineEnd = convertRawProp(
      context,
      rawProps,
      "paddingInlineEnd",
      sourceProps.paddingInlineEnd,
      yoga::value::undefined());
  paddingBlock = convertRawProp(
      context,
      rawProps,
      "paddingBlock",
      sourceProps.paddingBlock,
      yoga::value::undefined());
  paddingBlockStart = convertRawProp(
      context,
      rawProps,
      "paddingBlockStart",
      sourceProps.paddingBlockStart,
      yoga::value::undefined());
  paddingBlockEnd = convertRawProp(
      context,
      rawProps,
      "paddingBlockEnd",
      sourceProps.paddingBlockEnd,
      yoga::value::undefined());
}

} // namespace facebook::react
