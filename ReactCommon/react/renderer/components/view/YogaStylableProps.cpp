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
#include <yoga/YGNode.h>
#include <yoga/Yoga.h>

#include "conversions.h"

namespace facebook {
namespace react {

YogaStylableProps::YogaStylableProps(
    const PropsParserContext &context,
    YogaStylableProps const &sourceProps,
    RawProps const &rawProps,
    bool shouldSetRawProps)
    : Props(context, sourceProps, rawProps, shouldSetRawProps),
      yogaStyle(
          Props::enablePropIteratorSetter
              ? sourceProps.yogaStyle
              : convertRawProp(context, rawProps, sourceProps.yogaStyle)){};

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

#define REBUILD_FIELD_SWITCH_CASE(field) \
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
    REBUILD_FIELD_SWITCH_CASE(direction);
    REBUILD_FIELD_SWITCH_CASE(flexDirection);
    REBUILD_FIELD_SWITCH_CASE(justifyContent);
    REBUILD_FIELD_SWITCH_CASE(alignContent);
    REBUILD_FIELD_SWITCH_CASE(alignItems);
    REBUILD_FIELD_SWITCH_CASE(alignSelf);
    REBUILD_FIELD_SWITCH_CASE(flexWrap);
    REBUILD_FIELD_SWITCH_CASE(overflow);
    REBUILD_FIELD_SWITCH_CASE(display);
    REBUILD_FIELD_SWITCH_CASE(flex);
    REBUILD_FIELD_SWITCH_CASE(flexGrow);
    REBUILD_FIELD_SWITCH_CASE(flexShrink);
    REBUILD_FIELD_SWITCH_CASE(flexBasis);
    REBUILD_FIELD_SWITCH_CASE2(positionType, "position");
    REBUILD_FIELD_SWITCH_CASE(aspectRatio);
    REBUILD_FIELD_YG_DIMENSION(dimensions, "width", "height");
    REBUILD_FIELD_YG_DIMENSION(minDimensions, "minWidth", "minHeight");
    REBUILD_FIELD_YG_DIMENSION(maxDimensions, "maxWidth", "maxHeight");
    REBUILD_FIELD_YG_EDGES_POSITION();
    REBUILD_FIELD_YG_EDGES(margin, "margin", "");
    REBUILD_FIELD_YG_EDGES(padding, "padding", "");
    REBUILD_FIELD_YG_EDGES(border, "border", "Width");
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

} // namespace react
} // namespace facebook
