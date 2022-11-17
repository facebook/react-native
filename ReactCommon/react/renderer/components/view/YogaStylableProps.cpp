/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YogaStylableProps.h"

#include <react/renderer/components/view/conversions.h>
#include <react/renderer/components/view/propsConversions.h>
#include <react/renderer/core/CoreFeatures.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>
#include <yoga/YGNode.h>
#include <yoga/Yoga.h>

#include "conversions.h"

namespace facebook::react {

YogaStylableProps::YogaStylableProps(
    const PropsParserContext &context,
    YogaStylableProps const &sourceProps,
    RawProps const &rawProps,
    bool shouldSetRawProps)
    : Props(context, sourceProps, rawProps, shouldSetRawProps),
      yogaStyle(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.yogaStyle
              : convertRawProp(context, rawProps, sourceProps.yogaStyle)) {
  if (!CoreFeatures::enablePropIteratorSetter) {
    convertRawPropAliases(context, sourceProps, rawProps);
  }
};

template <typename T>
static inline T const getFieldValue(
    const PropsParserContext &context,
    RawValue const &value,
    T const defaultValue) {
  if (value.hasValue()) {
    T res;
    fromRawValue(context, value, res);
    return res;
  }

  return defaultValue;
}

#define REBUILD_FIELD_SWITCH_CASE2(field, fieldName)                     \
  case CONSTEXPR_RAW_PROPS_KEY_HASH(fieldName): {                        \
    yogaStyle.field() = getFieldValue(context, value, defaults.field()); \
    return;                                                              \
  }

// @lint-ignore CLANGTIDY cppcoreguidelines-macro-usage
#define REBUILD_FIELD_SWITCH_CASE_YSP(field) \
  REBUILD_FIELD_SWITCH_CASE2(field, #field)

#define REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(field, index, fieldName) \
  case CONSTEXPR_RAW_PROPS_KEY_HASH(fieldName): {                     \
    yogaStyle.field()[index] =                                        \
        getFieldValue(context, value, defaults.field()[index]);       \
    return;                                                           \
  }

#define REBUILD_FIELD_YG_DIMENSION(field, widthStr, heightStr)             \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(field, YGDimensionWidth, widthStr); \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(field, YGDimensionHeight, heightStr);

#define REBUILD_FIELD_YG_GUTTER(field, rowGapStr, columnGapStr, gapStr)      \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(field, YGGutterRow, rowGapStr);       \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(field, YGGutterColumn, columnGapStr); \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(field, YGGutterAll, gapStr);

#define REBUILD_FIELD_YG_EDGES(field, prefix, suffix)                          \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, YGEdgeLeft, prefix "Left" suffix);                                \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(field, YGEdgeTop, prefix "Top" suffix); \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, YGEdgeRight, prefix "Right" suffix);                              \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, YGEdgeBottom, prefix "Bottom" suffix);                            \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, YGEdgeStart, prefix "Start" suffix);                              \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(field, YGEdgeEnd, prefix "End" suffix); \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, YGEdgeHorizontal, prefix "Horizontal" suffix);                    \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, YGEdgeVertical, prefix "Vertical" suffix);                        \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(field, YGEdgeAll, prefix "" suffix);

#define REBUILD_FIELD_YG_EDGES_POSITION()                                 \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(position, YGEdgeLeft, "left");     \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(position, YGEdgeTop, "top");       \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(position, YGEdgeRight, "right");   \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(position, YGEdgeBottom, "bottom"); \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(position, YGEdgeStart, "start");   \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(position, YGEdgeEnd, "end");

void YogaStylableProps::setProp(
    const PropsParserContext &context,
    RawPropsPropNameHash hash,
    const char *propName,
    RawValue const &value) {
  static const auto defaults = YGStyle{};

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
    REBUILD_FIELD_YG_GUTTER(gap, "rowGap", "columnGap", "gap");
    REBUILD_FIELD_SWITCH_CASE_YSP(aspectRatio);
    REBUILD_FIELD_YG_DIMENSION(dimensions, "width", "height");
    REBUILD_FIELD_YG_DIMENSION(minDimensions, "minWidth", "minHeight");
    REBUILD_FIELD_YG_DIMENSION(maxDimensions, "maxWidth", "maxHeight");
    REBUILD_FIELD_YG_EDGES_POSITION();
    REBUILD_FIELD_YG_EDGES(margin, "margin", "");
    REBUILD_FIELD_YG_EDGES(padding, "padding", "");
    REBUILD_FIELD_YG_EDGES(border, "border", "Width");

    // Aliases
    RAW_SET_PROP_SWITCH_CASE(
        marginInline, "marginInline", CompactValue::ofUndefined());
    RAW_SET_PROP_SWITCH_CASE(
        marginInlineStart, "marginInlineStart", CompactValue::ofUndefined());
    RAW_SET_PROP_SWITCH_CASE(
        marginInlineEnd, "marginInlineEnd", CompactValue::ofUndefined());
    RAW_SET_PROP_SWITCH_CASE(
        marginBlock, "marginBlock", CompactValue::ofUndefined());
    RAW_SET_PROP_SWITCH_CASE(
        marginBlockStart, "marginBlockStart", CompactValue::ofUndefined());
    RAW_SET_PROP_SWITCH_CASE(
        marginBlockEnd, "marginBlockEnd", CompactValue::ofUndefined());
    RAW_SET_PROP_SWITCH_CASE(
        paddingInline, "paddingInline", CompactValue::ofUndefined());
    RAW_SET_PROP_SWITCH_CASE(
        paddingInlineStart, "paddingInlineStart", CompactValue::ofUndefined());
    RAW_SET_PROP_SWITCH_CASE(
        paddingInlineEnd, "paddingInlineEnd", CompactValue::ofUndefined());
    RAW_SET_PROP_SWITCH_CASE(
        paddingBlock, "paddingBlock", CompactValue::ofUndefined());
    RAW_SET_PROP_SWITCH_CASE(
        paddingBlockStart, "paddingBlockStart", CompactValue::ofUndefined());
    RAW_SET_PROP_SWITCH_CASE(
        paddingBlockEnd, "paddingBlockEnd", CompactValue::ofUndefined());
  }
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList YogaStylableProps::getDebugProps() const {
  auto const defaultYogaStyle = YGStyle{};
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
          yogaStyle.gap()[YGGutterRow],
          defaultYogaStyle.gap()[YGGutterRow]),
      debugStringConvertibleItem(
          "columnGap",
          yogaStyle.gap()[YGGutterColumn],
          defaultYogaStyle.gap()[YGGutterColumn]),
      debugStringConvertibleItem(
          "gap",
          yogaStyle.gap()[YGGutterAll],
          defaultYogaStyle.gap()[YGGutterAll]),
      debugStringConvertibleItem(
          "flexShrink", yogaStyle.flexShrink(), defaultYogaStyle.flexShrink()),
      debugStringConvertibleItem(
          "flexBasis", yogaStyle.flexBasis(), defaultYogaStyle.flexBasis()),
      debugStringConvertibleItem(
          "margin", yogaStyle.margin(), defaultYogaStyle.margin()),
      debugStringConvertibleItem(
          "position", yogaStyle.position(), defaultYogaStyle.position()),
      debugStringConvertibleItem(
          "padding", yogaStyle.padding(), defaultYogaStyle.padding()),
      debugStringConvertibleItem(
          "border", yogaStyle.border(), defaultYogaStyle.border()),
      debugStringConvertibleItem(
          "dimensions", yogaStyle.dimensions(), defaultYogaStyle.dimensions()),
      debugStringConvertibleItem(
          "minDimensions",
          yogaStyle.minDimensions(),
          defaultYogaStyle.minDimensions()),
      debugStringConvertibleItem(
          "maxDimensions",
          yogaStyle.maxDimensions(),
          defaultYogaStyle.maxDimensions()),
      debugStringConvertibleItem(
          "aspectRatio",
          yogaStyle.aspectRatio(),
          defaultYogaStyle.aspectRatio()),
  };
}
#endif

void YogaStylableProps::convertRawPropAliases(
    const PropsParserContext &context,
    YogaStylableProps const &sourceProps,
    RawProps const &rawProps) {
  marginInline = convertRawProp(
      context,
      rawProps,
      "marginInline",
      sourceProps.marginInline,
      CompactValue::ofUndefined());
  marginInlineStart = convertRawProp(
      context,
      rawProps,
      "marginInlineStart",
      sourceProps.marginInlineStart,
      CompactValue::ofUndefined());
  marginInlineEnd = convertRawProp(
      context,
      rawProps,
      "marginInlineEnd",
      sourceProps.marginInlineEnd,
      CompactValue::ofUndefined());
  marginBlock = convertRawProp(
      context,
      rawProps,
      "marginBlock",
      sourceProps.marginBlock,
      CompactValue::ofUndefined());
  marginBlockStart = convertRawProp(
      context,
      rawProps,
      "marginBlockStart",
      sourceProps.marginBlockStart,
      CompactValue::ofUndefined());
  marginBlockEnd = convertRawProp(
      context,
      rawProps,
      "marginBlockEnd",
      sourceProps.marginBlockEnd,
      CompactValue::ofUndefined());

  paddingInline = convertRawProp(
      context,
      rawProps,
      "paddingInline",
      sourceProps.paddingInline,
      CompactValue::ofUndefined());
  paddingInlineStart = convertRawProp(
      context,
      rawProps,
      "paddingInlineStart",
      sourceProps.paddingInlineStart,
      CompactValue::ofUndefined());
  paddingInlineEnd = convertRawProp(
      context,
      rawProps,
      "paddingInlineEnd",
      sourceProps.paddingInlineEnd,
      CompactValue::ofUndefined());
  paddingBlock = convertRawProp(
      context,
      rawProps,
      "paddingBlock",
      sourceProps.paddingBlock,
      CompactValue::ofUndefined());
  paddingBlockStart = convertRawProp(
      context,
      rawProps,
      "paddingBlockStart",
      sourceProps.paddingBlockStart,
      CompactValue::ofUndefined());
  paddingBlockEnd = convertRawProp(
      context,
      rawProps,
      "paddingBlockEnd",
      sourceProps.paddingBlockEnd,
      CompactValue::ofUndefined());
}

} // namespace facebook::react
