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
#include <yoga/Yoga.h>

namespace facebook::react {

YogaStylableProps::YogaStylableProps(
    const PropsParserContext& context,
    const YogaStylableProps& sourceProps,
    const RawProps& rawProps,
    const std::function<bool(const std::string&)>& filterObjectKeys)
    : Props() {
  initialize(context, sourceProps, rawProps, filterObjectKeys);

  yogaStyle.setDirection(convertRawProp(
      context,
      rawProps,
      "direction",
      sourceProps.yogaStyle.direction(),
      yogaStyle.direction()));

  yogaStyle.setFlexDirection(convertRawProp(
      context,
      rawProps,
      "flexDirection",
      sourceProps.yogaStyle.flexDirection(),
      yogaStyle.flexDirection()));

  yogaStyle.setJustifyContent(convertRawProp(
      context,
      rawProps,
      "justifyContent",
      sourceProps.yogaStyle.justifyContent(),
      yogaStyle.justifyContent()));

  yogaStyle.setAlignContent(convertRawProp(
      context,
      rawProps,
      "alignContent",
      sourceProps.yogaStyle.alignContent(),
      yogaStyle.alignContent()));

  yogaStyle.setAlignItems(convertRawProp(
      context,
      rawProps,
      "alignItems",
      sourceProps.yogaStyle.alignItems(),
      yogaStyle.alignItems()));

  yogaStyle.setAlignSelf(convertRawProp(
      context,
      rawProps,
      "alignSelf",
      sourceProps.yogaStyle.alignSelf(),
      yogaStyle.alignSelf()));

  yogaStyle.setPositionType(convertRawProp(
      context,
      rawProps,
      "position",
      sourceProps.yogaStyle.positionType(),
      yogaStyle.positionType()));

  yogaStyle.setFlexWrap(convertRawProp(
      context,
      rawProps,
      "flexWrap",
      sourceProps.yogaStyle.flexWrap(),
      yogaStyle.flexWrap()));

  yogaStyle.setOverflow(convertRawProp(
      context,
      rawProps,
      "overflow",
      sourceProps.yogaStyle.overflow(),
      yogaStyle.overflow()));

  yogaStyle.setDisplay(convertRawProp(
      context,
      rawProps,
      "display",
      sourceProps.yogaStyle.display(),
      yogaStyle.display()));

  yogaStyle.setFlex(convertRawProp(
      context,
      rawProps,
      "flex",
      sourceProps.yogaStyle.flex(),
      yogaStyle.flex()));

  yogaStyle.setFlexGrow(convertRawProp(
      context,
      rawProps,
      "flexGrow",
      sourceProps.yogaStyle.flexGrow(),
      yogaStyle.flexGrow()));

  yogaStyle.setFlexShrink(convertRawProp(
      context,
      rawProps,
      "flexShrink",
      sourceProps.yogaStyle.flexShrink(),
      yogaStyle.flexShrink()));

  yogaStyle.setFlexBasis(convertRawProp(
      context,
      rawProps,
      "flexBasis",
      sourceProps.yogaStyle.flexBasis(),
      yogaStyle.flexBasis()));

  yogaStyle.setMargin(
      yoga::Edge::Left,
      convertRawProp(
          context,
          rawProps,
          "marginLeft",
          sourceProps.yogaStyle.margin(yoga::Edge::Left),
          yogaStyle.margin(yoga::Edge::Left)));

  yogaStyle.setMargin(
      yoga::Edge::Top,
      convertRawProp(
          context,
          rawProps,
          "marginTop",
          sourceProps.yogaStyle.margin(yoga::Edge::Top),
          yogaStyle.margin(yoga::Edge::Top)));

  yogaStyle.setMargin(
      yoga::Edge::Right,
      convertRawProp(
          context,
          rawProps,
          "marginRight",
          sourceProps.yogaStyle.margin(yoga::Edge::Right),
          yogaStyle.margin(yoga::Edge::Right)));

  yogaStyle.setMargin(
      yoga::Edge::Bottom,
      convertRawProp(
          context,
          rawProps,
          "marginBottom",
          sourceProps.yogaStyle.margin(yoga::Edge::Bottom),
          yogaStyle.margin(yoga::Edge::Bottom)));

  yogaStyle.setMargin(
      yoga::Edge::Start,
      convertRawProp(
          context,
          rawProps,
          "marginStart",
          sourceProps.yogaStyle.margin(yoga::Edge::Start),
          yogaStyle.margin(yoga::Edge::Start)));

  yogaStyle.setMargin(
      yoga::Edge::End,
      convertRawProp(
          context,
          rawProps,
          "marginEnd",
          sourceProps.yogaStyle.margin(yoga::Edge::End),
          yogaStyle.margin(yoga::Edge::End)));

  yogaStyle.setMargin(
      yoga::Edge::Horizontal,
      convertRawProp(
          context,
          rawProps,
          "marginHorizontal",
          sourceProps.yogaStyle.margin(yoga::Edge::Horizontal),
          yogaStyle.margin(yoga::Edge::Horizontal)));

  yogaStyle.setMargin(
      yoga::Edge::Vertical,
      convertRawProp(
          context,
          rawProps,
          "marginVertical",
          sourceProps.yogaStyle.margin(yoga::Edge::Vertical),
          yogaStyle.margin(yoga::Edge::Vertical)));

  yogaStyle.setMargin(
      yoga::Edge::All,
      convertRawProp(
          context,
          rawProps,
          "margin",
          sourceProps.yogaStyle.margin(yoga::Edge::All),
          yogaStyle.margin(yoga::Edge::All)));

  yogaStyle.setPosition(
      yoga::Edge::Left,
      convertRawProp(
          context,
          rawProps,
          "left",
          sourceProps.yogaStyle.position(yoga::Edge::Left),
          yogaStyle.position(yoga::Edge::Left)));

  yogaStyle.setPosition(
      yoga::Edge::Top,
      convertRawProp(
          context,
          rawProps,
          "top",
          sourceProps.yogaStyle.position(yoga::Edge::Top),
          yogaStyle.position(yoga::Edge::Top)));

  yogaStyle.setPosition(
      yoga::Edge::Right,
      convertRawProp(
          context,
          rawProps,
          "right",
          sourceProps.yogaStyle.position(yoga::Edge::Right),
          yogaStyle.position(yoga::Edge::Right)));

  yogaStyle.setPosition(
      yoga::Edge::Bottom,
      convertRawProp(
          context,
          rawProps,
          "bottom",
          sourceProps.yogaStyle.position(yoga::Edge::Bottom),
          yogaStyle.position(yoga::Edge::Bottom)));

  yogaStyle.setPosition(
      yoga::Edge::Start,
      convertRawProp(
          context,
          rawProps,
          "start",
          sourceProps.yogaStyle.position(yoga::Edge::Start),
          yogaStyle.position(yoga::Edge::Start)));

  yogaStyle.setPosition(
      yoga::Edge::End,
      convertRawProp(
          context,
          rawProps,
          "end",
          sourceProps.yogaStyle.position(yoga::Edge::End),
          yogaStyle.position(yoga::Edge::End)));

  yogaStyle.setPosition(
      yoga::Edge::Horizontal,
      convertRawProp(
          context,
          rawProps,
          "insetInline",
          sourceProps.yogaStyle.position(yoga::Edge::Horizontal),
          yogaStyle.position(yoga::Edge::Horizontal)));

  yogaStyle.setPosition(
      yoga::Edge::Vertical,
      convertRawProp(
          context,
          rawProps,
          "insetBlock",
          sourceProps.yogaStyle.position(yoga::Edge::Vertical),
          yogaStyle.position(yoga::Edge::Vertical)));

  yogaStyle.setPosition(
      yoga::Edge::All,
      convertRawProp(
          context,
          rawProps,
          "inset",
          sourceProps.yogaStyle.position(yoga::Edge::All),
          yogaStyle.position(yoga::Edge::All)));

  yogaStyle.setPadding(
      yoga::Edge::Left,
      convertRawProp(
          context,
          rawProps,
          "paddingLeft",
          sourceProps.yogaStyle.padding(yoga::Edge::Left),
          yogaStyle.padding(yoga::Edge::Left)));

  yogaStyle.setPadding(
      yoga::Edge::Top,
      convertRawProp(
          context,
          rawProps,
          "paddingTop",
          sourceProps.yogaStyle.padding(yoga::Edge::Top),
          yogaStyle.padding(yoga::Edge::Top)));

  yogaStyle.setPadding(
      yoga::Edge::Right,
      convertRawProp(
          context,
          rawProps,
          "paddingRight",
          sourceProps.yogaStyle.padding(yoga::Edge::Right),
          yogaStyle.padding(yoga::Edge::Right)));

  yogaStyle.setPadding(
      yoga::Edge::Bottom,
      convertRawProp(
          context,
          rawProps,
          "paddingBottom",
          sourceProps.yogaStyle.padding(yoga::Edge::Bottom),
          yogaStyle.padding(yoga::Edge::Bottom)));

  yogaStyle.setPadding(
      yoga::Edge::Start,
      convertRawProp(
          context,
          rawProps,
          "paddingStart",
          sourceProps.yogaStyle.padding(yoga::Edge::Start),
          yogaStyle.padding(yoga::Edge::Start)));

  yogaStyle.setPadding(
      yoga::Edge::End,
      convertRawProp(
          context,
          rawProps,
          "paddingEnd",
          sourceProps.yogaStyle.padding(yoga::Edge::End),
          yogaStyle.padding(yoga::Edge::End)));

  yogaStyle.setPadding(
      yoga::Edge::Horizontal,
      convertRawProp(
          context,
          rawProps,
          "paddingHorizontal",
          sourceProps.yogaStyle.padding(yoga::Edge::Horizontal),
          yogaStyle.padding(yoga::Edge::Horizontal)));

  yogaStyle.setPadding(
      yoga::Edge::Vertical,
      convertRawProp(
          context,
          rawProps,
          "paddingVertical",
          sourceProps.yogaStyle.padding(yoga::Edge::Vertical),
          yogaStyle.padding(yoga::Edge::Vertical)));

  yogaStyle.setPadding(
      yoga::Edge::All,
      convertRawProp(
          context,
          rawProps,
          "padding",
          sourceProps.yogaStyle.padding(yoga::Edge::All),
          yogaStyle.padding(yoga::Edge::All)));

  yogaStyle.setGap(
      yoga::Gutter::Row,
      convertRawProp(
          context,
          rawProps,
          "rowGap",
          sourceProps.yogaStyle.gap(yoga::Gutter::Row),
          yogaStyle.gap(yoga::Gutter::Row)));

  yogaStyle.setGap(
      yoga::Gutter::Column,
      convertRawProp(
          context,
          rawProps,
          "columnGap",
          sourceProps.yogaStyle.gap(yoga::Gutter::Column),
          yogaStyle.gap(yoga::Gutter::Column)));

  yogaStyle.setGap(
      yoga::Gutter::All,
      convertRawProp(
          context,
          rawProps,
          "gap",
          sourceProps.yogaStyle.gap(yoga::Gutter::All),
          yogaStyle.gap(yoga::Gutter::All)));

  yogaStyle.setBorder(
      yoga::Edge::Left,
      convertRawProp(
          context,
          rawProps,
          "borderLeftWidth",
          sourceProps.yogaStyle.border(yoga::Edge::Left),
          yogaStyle.border(yoga::Edge::Left)));

  yogaStyle.setBorder(
      yoga::Edge::Top,
      convertRawProp(
          context,
          rawProps,
          "borderTopWidth",
          sourceProps.yogaStyle.border(yoga::Edge::Top),
          yogaStyle.border(yoga::Edge::Top)));

  yogaStyle.setBorder(
      yoga::Edge::Right,
      convertRawProp(
          context,
          rawProps,
          "borderRightWidth",
          sourceProps.yogaStyle.border(yoga::Edge::Right),
          yogaStyle.border(yoga::Edge::Right)));

  yogaStyle.setBorder(
      yoga::Edge::Bottom,
      convertRawProp(
          context,
          rawProps,
          "borderBottomWidth",
          sourceProps.yogaStyle.border(yoga::Edge::Bottom),
          yogaStyle.border(yoga::Edge::Bottom)));

  yogaStyle.setBorder(
      yoga::Edge::Start,
      convertRawProp(
          context,
          rawProps,
          "borderStartWidth",
          sourceProps.yogaStyle.border(yoga::Edge::Start),
          yogaStyle.border(yoga::Edge::Start)));

  yogaStyle.setBorder(
      yoga::Edge::End,
      convertRawProp(
          context,
          rawProps,
          "borderEndWidth",
          sourceProps.yogaStyle.border(yoga::Edge::End),
          yogaStyle.border(yoga::Edge::End)));

  yogaStyle.setBorder(
      yoga::Edge::Horizontal,
      convertRawProp(
          context,
          rawProps,
          "borderHorizontalWidth",
          sourceProps.yogaStyle.border(yoga::Edge::Horizontal),
          yogaStyle.border(yoga::Edge::Horizontal)));

  yogaStyle.setBorder(
      yoga::Edge::Vertical,
      convertRawProp(
          context,
          rawProps,
          "borderVerticalWidth",
          sourceProps.yogaStyle.border(yoga::Edge::Vertical),
          yogaStyle.border(yoga::Edge::Vertical)));

  yogaStyle.setBorder(
      yoga::Edge::All,
      convertRawProp(
          context,
          rawProps,
          "borderWidth",
          sourceProps.yogaStyle.border(yoga::Edge::All),
          yogaStyle.border(yoga::Edge::All)));

  yogaStyle.setDimension(
      yoga::Dimension::Width,
      convertRawProp(
          context,
          rawProps,
          "width",
          sourceProps.yogaStyle.dimension(yoga::Dimension::Width),
          {}));

  yogaStyle.setDimension(
      yoga::Dimension::Height,
      convertRawProp(
          context,
          rawProps,
          "height",
          sourceProps.yogaStyle.dimension(yoga::Dimension::Height),
          {}));

  yogaStyle.setMinDimension(
      yoga::Dimension::Width,
      convertRawProp(
          context,
          rawProps,
          "minWidth",
          sourceProps.yogaStyle.minDimension(yoga::Dimension::Width),
          {}));

  yogaStyle.setMinDimension(
      yoga::Dimension::Height,
      convertRawProp(
          context,
          rawProps,
          "minHeight",
          sourceProps.yogaStyle.minDimension(yoga::Dimension::Height),
          {}));

  yogaStyle.setMaxDimension(
      yoga::Dimension::Width,
      convertRawProp(
          context,
          rawProps,
          "maxWidth",
          sourceProps.yogaStyle.maxDimension(yoga::Dimension::Width),
          {}));

  yogaStyle.setMaxDimension(
      yoga::Dimension::Height,
      convertRawProp(
          context,
          rawProps,
          "maxHeight",
          sourceProps.yogaStyle.maxDimension(yoga::Dimension::Height),
          {}));

  yogaStyle.setAspectRatio(convertRawProp(
      context,
      rawProps,
      "aspectRatio",
      sourceProps.yogaStyle.aspectRatio(),
      yogaStyle.aspectRatio()));

  yogaStyle.setBoxSizing(convertRawProp(
      context,
      rawProps,
      "boxSizing",
      sourceProps.yogaStyle.boxSizing(),
      yogaStyle.boxSizing()));

  convertRawPropAliases(context, sourceProps, rawProps);
};

void YogaStylableProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  Props::setProp(context, hash, propName, value);
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
          yogaStyle.margin(yoga::Edge::Left),
          defaultYogaStyle.margin(yoga::Edge::Left)),
      debugStringConvertibleItem(
          "marginTop",
          yogaStyle.margin(yoga::Edge::Top),
          defaultYogaStyle.margin(yoga::Edge::Top)),
      debugStringConvertibleItem(
          "marginRight",
          yogaStyle.margin(yoga::Edge::Right),
          defaultYogaStyle.margin(yoga::Edge::Right)),
      debugStringConvertibleItem(
          "marginBottom",
          yogaStyle.margin(yoga::Edge::Bottom),
          defaultYogaStyle.margin(yoga::Edge::Bottom)),
      debugStringConvertibleItem(
          "marginStart",
          yogaStyle.margin(yoga::Edge::Start),
          defaultYogaStyle.margin(yoga::Edge::Start)),
      debugStringConvertibleItem(
          "marginEnd",
          yogaStyle.margin(yoga::Edge::End),
          defaultYogaStyle.margin(yoga::Edge::End)),
      debugStringConvertibleItem(
          "marginHorizontal",
          yogaStyle.margin(yoga::Edge::Horizontal),
          defaultYogaStyle.margin(yoga::Edge::Horizontal)),
      debugStringConvertibleItem(
          "marginVertical",
          yogaStyle.margin(yoga::Edge::Vertical),
          defaultYogaStyle.margin(yoga::Edge::Vertical)),
      debugStringConvertibleItem(
          "margin",
          yogaStyle.margin(yoga::Edge::All),
          defaultYogaStyle.margin(yoga::Edge::All)),
      debugStringConvertibleItem(
          "left",
          yogaStyle.position(yoga::Edge::Left),
          defaultYogaStyle.position(yoga::Edge::Left)),
      debugStringConvertibleItem(
          "top",
          yogaStyle.position(yoga::Edge::Top),
          defaultYogaStyle.position(yoga::Edge::Top)),
      debugStringConvertibleItem(
          "right",
          yogaStyle.position(yoga::Edge::Right),
          defaultYogaStyle.position(yoga::Edge::Right)),
      debugStringConvertibleItem(
          "bottom",
          yogaStyle.position(yoga::Edge::Bottom),
          defaultYogaStyle.position(yoga::Edge::Bottom)),
      debugStringConvertibleItem(
          "start",
          yogaStyle.position(yoga::Edge::Start),
          defaultYogaStyle.position(yoga::Edge::Start)),
      debugStringConvertibleItem(
          "end",
          yogaStyle.position(yoga::Edge::End),
          defaultYogaStyle.position(yoga::Edge::End)),
      debugStringConvertibleItem(
          "inseInline",
          yogaStyle.position(yoga::Edge::Horizontal),
          defaultYogaStyle.position(yoga::Edge::Horizontal)),
      debugStringConvertibleItem(
          "insetBlock",
          yogaStyle.position(yoga::Edge::Vertical),
          defaultYogaStyle.position(yoga::Edge::Vertical)),
      debugStringConvertibleItem(
          "inset",
          yogaStyle.position(yoga::Edge::All),
          defaultYogaStyle.position(yoga::Edge::All)),
      debugStringConvertibleItem(
          "paddingLeft",
          yogaStyle.padding(yoga::Edge::Left),
          defaultYogaStyle.padding(yoga::Edge::Left)),
      debugStringConvertibleItem(
          "paddingTop",
          yogaStyle.padding(yoga::Edge::Top),
          defaultYogaStyle.padding(yoga::Edge::Top)),
      debugStringConvertibleItem(
          "paddingRight",
          yogaStyle.padding(yoga::Edge::Right),
          defaultYogaStyle.padding(yoga::Edge::Right)),
      debugStringConvertibleItem(
          "paddingBottom",
          yogaStyle.padding(yoga::Edge::Bottom),
          defaultYogaStyle.padding(yoga::Edge::Bottom)),
      debugStringConvertibleItem(
          "paddingStart",
          yogaStyle.padding(yoga::Edge::Start),
          defaultYogaStyle.padding(yoga::Edge::Start)),
      debugStringConvertibleItem(
          "paddingEnd",
          yogaStyle.padding(yoga::Edge::End),
          defaultYogaStyle.padding(yoga::Edge::End)),
      debugStringConvertibleItem(
          "paddingHorizontal",
          yogaStyle.padding(yoga::Edge::Horizontal),
          defaultYogaStyle.padding(yoga::Edge::Horizontal)),
      debugStringConvertibleItem(
          "paddingVertical",
          yogaStyle.padding(yoga::Edge::Vertical),
          defaultYogaStyle.padding(yoga::Edge::Vertical)),
      debugStringConvertibleItem(
          "padding",
          yogaStyle.padding(yoga::Edge::All),
          defaultYogaStyle.padding(yoga::Edge::All)),
      debugStringConvertibleItem(
          "borderLeftWidth",
          yogaStyle.border(yoga::Edge::Left),
          defaultYogaStyle.border(yoga::Edge::Left)),
      debugStringConvertibleItem(
          "borderTopWidth",
          yogaStyle.border(yoga::Edge::Top),
          defaultYogaStyle.border(yoga::Edge::Top)),
      debugStringConvertibleItem(
          "borderRightWidth",
          yogaStyle.border(yoga::Edge::Right),
          defaultYogaStyle.border(yoga::Edge::Right)),
      debugStringConvertibleItem(
          "borderBottomWidth",
          yogaStyle.border(yoga::Edge::Bottom),
          defaultYogaStyle.border(yoga::Edge::Bottom)),
      debugStringConvertibleItem(
          "borderStartWidth",
          yogaStyle.border(yoga::Edge::Start),
          defaultYogaStyle.border(yoga::Edge::Start)),
      debugStringConvertibleItem(
          "borderEndWidth",
          yogaStyle.border(yoga::Edge::End),
          defaultYogaStyle.border(yoga::Edge::End)),
      debugStringConvertibleItem(
          "borderHorizontalWidth",
          yogaStyle.border(yoga::Edge::Horizontal),
          defaultYogaStyle.border(yoga::Edge::Horizontal)),
      debugStringConvertibleItem(
          "borderVerticalWidth",
          yogaStyle.border(yoga::Edge::Vertical),
          defaultYogaStyle.border(yoga::Edge::Vertical)),
      debugStringConvertibleItem(
          "bordeWidth",
          yogaStyle.border(yoga::Edge::All),
          defaultYogaStyle.border(yoga::Edge::All)),
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
      yoga::StyleLength::undefined());
  insetBlockStart = convertRawProp(
      context,
      rawProps,
      "insetBlockStart",
      sourceProps.insetBlockStart,
      yoga::StyleLength::undefined());
  insetInlineEnd = convertRawProp(
      context,
      rawProps,
      "insetInlineEnd",
      sourceProps.insetInlineEnd,
      yoga::StyleLength::undefined());
  insetInlineStart = convertRawProp(
      context,
      rawProps,
      "insetInlineStart",
      sourceProps.insetInlineStart,
      yoga::StyleLength::undefined());
  marginInline = convertRawProp(
      context,
      rawProps,
      "marginInline",
      sourceProps.marginInline,
      yoga::StyleLength::undefined());
  marginInlineStart = convertRawProp(
      context,
      rawProps,
      "marginInlineStart",
      sourceProps.marginInlineStart,
      yoga::StyleLength::undefined());
  marginInlineEnd = convertRawProp(
      context,
      rawProps,
      "marginInlineEnd",
      sourceProps.marginInlineEnd,
      yoga::StyleLength::undefined());
  marginBlock = convertRawProp(
      context,
      rawProps,
      "marginBlock",
      sourceProps.marginBlock,
      yoga::StyleLength::undefined());
  marginBlockStart = convertRawProp(
      context,
      rawProps,
      "marginBlockStart",
      sourceProps.marginBlockStart,
      yoga::StyleLength::undefined());
  marginBlockEnd = convertRawProp(
      context,
      rawProps,
      "marginBlockEnd",
      sourceProps.marginBlockEnd,
      yoga::StyleLength::undefined());

  paddingInline = convertRawProp(
      context,
      rawProps,
      "paddingInline",
      sourceProps.paddingInline,
      yoga::StyleLength::undefined());
  paddingInlineStart = convertRawProp(
      context,
      rawProps,
      "paddingInlineStart",
      sourceProps.paddingInlineStart,
      yoga::StyleLength::undefined());
  paddingInlineEnd = convertRawProp(
      context,
      rawProps,
      "paddingInlineEnd",
      sourceProps.paddingInlineEnd,
      yoga::StyleLength::undefined());
  paddingBlock = convertRawProp(
      context,
      rawProps,
      "paddingBlock",
      sourceProps.paddingBlock,
      yoga::StyleLength::undefined());
  paddingBlockStart = convertRawProp(
      context,
      rawProps,
      "paddingBlockStart",
      sourceProps.paddingBlockStart,
      yoga::StyleLength::undefined());
  paddingBlockEnd = convertRawProp(
      context,
      rawProps,
      "paddingBlockEnd",
      sourceProps.paddingBlockEnd,
      yoga::StyleLength::undefined());
}

} // namespace facebook::react
