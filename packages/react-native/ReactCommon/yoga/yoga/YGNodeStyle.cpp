/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/Yoga.h>
#include <yoga/debug/AssertFatal.h>
#include <yoga/node/Node.h>

using namespace facebook;
using namespace facebook::yoga;

namespace {

template <auto GetterT, auto SetterT, typename ValueT>
void updateStyle(YGNodeRef node, ValueT value) {
  auto& style = resolveRef(node)->getStyle();
  if ((style.*GetterT)() != value) {
    (style.*SetterT)(value);
    resolveRef(node)->markDirtyAndPropagate();
  }
}

template <auto GetterT, auto SetterT, typename IdxT, typename ValueT>
void updateStyle(YGNodeRef node, IdxT idx, ValueT value) {
  auto& style = resolveRef(node)->getStyle();
  if ((style.*GetterT)(idx) != value) {
    (style.*SetterT)(idx, value);
    resolveRef(node)->markDirtyAndPropagate();
  }
}

} // namespace

void YGNodeCopyStyle(
    const YGNodeRef dstNodeRef,
    const YGNodeConstRef srcNodeRef) {
  auto dstNode = resolveRef(dstNodeRef);
  auto srcNode = resolveRef(srcNodeRef);

  if (!(dstNode->getStyle() == srcNode->getStyle())) {
    dstNode->setStyle(srcNode->getStyle());
    dstNode->markDirtyAndPropagate();
  }
}

void YGNodeStyleSetDirection(const YGNodeRef node, const YGDirection value) {
  updateStyle<&Style::direction, &Style::setDirection>(node, scopedEnum(value));
}

YGDirection YGNodeStyleGetDirection(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().direction());
}

void YGNodeStyleSetFlexDirection(
    const YGNodeRef node,
    const YGFlexDirection flexDirection) {
  updateStyle<&Style::flexDirection, &Style::setFlexDirection>(
      node, scopedEnum(flexDirection));
}

YGFlexDirection YGNodeStyleGetFlexDirection(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().flexDirection());
}

void YGNodeStyleSetJustifyContent(
    const YGNodeRef node,
    const YGJustify justifyContent) {
  updateStyle<&Style::justifyContent, &Style::setJustifyContent>(
      node, scopedEnum(justifyContent));
}

YGJustify YGNodeStyleGetJustifyContent(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().justifyContent());
}

void YGNodeStyleSetAlignContent(
    const YGNodeRef node,
    const YGAlign alignContent) {
  updateStyle<&Style::alignContent, &Style::setAlignContent>(
      node, scopedEnum(alignContent));
}

YGAlign YGNodeStyleGetAlignContent(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().alignContent());
}

void YGNodeStyleSetAlignItems(const YGNodeRef node, const YGAlign alignItems) {
  updateStyle<&Style::alignItems, &Style::setAlignItems>(
      node, scopedEnum(alignItems));
}

YGAlign YGNodeStyleGetAlignItems(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().alignItems());
}

void YGNodeStyleSetAlignSelf(const YGNodeRef node, const YGAlign alignSelf) {
  updateStyle<&Style::alignSelf, &Style::setAlignSelf>(
      node, scopedEnum(alignSelf));
}

YGAlign YGNodeStyleGetAlignSelf(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().alignSelf());
}

void YGNodeStyleSetPositionType(
    const YGNodeRef node,
    const YGPositionType positionType) {
  updateStyle<&Style::positionType, &Style::setPositionType>(
      node, scopedEnum(positionType));
}

YGPositionType YGNodeStyleGetPositionType(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().positionType());
}

void YGNodeStyleSetFlexWrap(const YGNodeRef node, const YGWrap flexWrap) {
  updateStyle<&Style::flexWrap, &Style::setFlexWrap>(
      node, scopedEnum(flexWrap));
}

YGWrap YGNodeStyleGetFlexWrap(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().flexWrap());
}

void YGNodeStyleSetOverflow(const YGNodeRef node, const YGOverflow overflow) {
  updateStyle<&Style::overflow, &Style::setOverflow>(
      node, scopedEnum(overflow));
}

YGOverflow YGNodeStyleGetOverflow(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().overflow());
}

void YGNodeStyleSetDisplay(const YGNodeRef node, const YGDisplay display) {
  updateStyle<&Style::display, &Style::setDisplay>(node, scopedEnum(display));
}

YGDisplay YGNodeStyleGetDisplay(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().display());
}

void YGNodeStyleSetFlex(const YGNodeRef node, const float flex) {
  updateStyle<&Style::flex, &Style::setFlex>(node, FloatOptional{flex});
}

float YGNodeStyleGetFlex(const YGNodeConstRef nodeRef) {
  const auto node = resolveRef(nodeRef);
  return node->getStyle().flex().isUndefined()
      ? YGUndefined
      : node->getStyle().flex().unwrap();
}

void YGNodeStyleSetFlexGrow(const YGNodeRef node, const float flexGrow) {
  updateStyle<&Style::flexGrow, &Style::setFlexGrow>(
      node, FloatOptional{flexGrow});
}

float YGNodeStyleGetFlexGrow(const YGNodeConstRef nodeRef) {
  const auto node = resolveRef(nodeRef);
  return node->getStyle().flexGrow().isUndefined()
      ? Style::DefaultFlexGrow
      : node->getStyle().flexGrow().unwrap();
}

void YGNodeStyleSetFlexShrink(const YGNodeRef node, const float flexShrink) {
  updateStyle<&Style::flexShrink, &Style::setFlexShrink>(
      node, FloatOptional{flexShrink});
}

float YGNodeStyleGetFlexShrink(const YGNodeConstRef nodeRef) {
  const auto node = resolveRef(nodeRef);
  return node->getStyle().flexShrink().isUndefined()
      ? (node->getConfig()->useWebDefaults() ? Style::WebDefaultFlexShrink
                                             : Style::DefaultFlexShrink)
      : node->getStyle().flexShrink().unwrap();
}

void YGNodeStyleSetFlexBasis(const YGNodeRef node, const float flexBasis) {
  updateStyle<&Style::flexBasis, &Style::setFlexBasis>(
      node, value::points(flexBasis));
}

void YGNodeStyleSetFlexBasisPercent(
    const YGNodeRef node,
    const float flexBasisPercent) {
  updateStyle<&Style::flexBasis, &Style::setFlexBasis>(
      node, value::percent(flexBasisPercent));
}

void YGNodeStyleSetFlexBasisAuto(const YGNodeRef node) {
  updateStyle<&Style::flexBasis, &Style::setFlexBasis>(node, value::ofAuto());
}

YGValue YGNodeStyleGetFlexBasis(const YGNodeConstRef node) {
  return (YGValue)resolveRef(node)->getStyle().flexBasis();
}

void YGNodeStyleSetPosition(YGNodeRef node, YGEdge edge, float points) {
  updateStyle<&Style::position, &Style::setPosition>(
      node, scopedEnum(edge), value::points(points));
}

void YGNodeStyleSetPositionPercent(YGNodeRef node, YGEdge edge, float percent) {
  updateStyle<&Style::position, &Style::setPosition>(
      node, scopedEnum(edge), value::percent(percent));
}

YGValue YGNodeStyleGetPosition(YGNodeConstRef node, YGEdge edge) {
  return (YGValue)resolveRef(node)->getStyle().position(scopedEnum(edge));
}

void YGNodeStyleSetMargin(YGNodeRef node, YGEdge edge, float points) {
  updateStyle<&Style::margin, &Style::setMargin>(
      node, scopedEnum(edge), value::points(points));
}

void YGNodeStyleSetMarginPercent(YGNodeRef node, YGEdge edge, float percent) {
  updateStyle<&Style::margin, &Style::setMargin>(
      node, scopedEnum(edge), value::percent(percent));
}

void YGNodeStyleSetMarginAuto(YGNodeRef node, YGEdge edge) {
  updateStyle<&Style::margin, &Style::setMargin>(
      node, scopedEnum(edge), value::ofAuto());
}

YGValue YGNodeStyleGetMargin(YGNodeConstRef node, YGEdge edge) {
  return (YGValue)resolveRef(node)->getStyle().margin(scopedEnum(edge));
}

void YGNodeStyleSetPadding(YGNodeRef node, YGEdge edge, float points) {
  updateStyle<&Style::padding, &Style::setPadding>(
      node, scopedEnum(edge), value::points(points));
}

void YGNodeStyleSetPaddingPercent(YGNodeRef node, YGEdge edge, float percent) {
  updateStyle<&Style::padding, &Style::setPadding>(
      node, scopedEnum(edge), value::percent(percent));
}

YGValue YGNodeStyleGetPadding(YGNodeConstRef node, YGEdge edge) {
  return (YGValue)resolveRef(node)->getStyle().padding(scopedEnum(edge));
}

void YGNodeStyleSetBorder(
    const YGNodeRef node,
    const YGEdge edge,
    const float border) {
  updateStyle<&Style::border, &Style::setBorder>(
      node, scopedEnum(edge), value::points(border));
}

float YGNodeStyleGetBorder(const YGNodeConstRef node, const YGEdge edge) {
  auto border = resolveRef(node)->getStyle().border(scopedEnum(edge));
  if (border.isUndefined() || border.isAuto()) {
    return YGUndefined;
  }

  return static_cast<YGValue>(border).value;
}

void YGNodeStyleSetGap(
    const YGNodeRef node,
    const YGGutter gutter,
    const float gapLength) {
  updateStyle<&Style::gap, &Style::setGap>(
      node, scopedEnum(gutter), value::points(gapLength));
}

float YGNodeStyleGetGap(const YGNodeConstRef node, const YGGutter gutter) {
  auto gapLength = resolveRef(node)->getStyle().gap(scopedEnum(gutter));
  if (gapLength.isUndefined() || gapLength.isAuto()) {
    return YGUndefined;
  }

  return static_cast<YGValue>(gapLength).value;
}

void YGNodeStyleSetAspectRatio(const YGNodeRef node, const float aspectRatio) {
  updateStyle<&Style::aspectRatio, &Style::setAspectRatio>(
      node, FloatOptional{aspectRatio});
}

float YGNodeStyleGetAspectRatio(const YGNodeConstRef node) {
  const FloatOptional op = resolveRef(node)->getStyle().aspectRatio();
  return op.isUndefined() ? YGUndefined : op.unwrap();
}

void YGNodeStyleSetWidth(YGNodeRef node, float points) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Width, value::points(points));
}

void YGNodeStyleSetWidthPercent(YGNodeRef node, float percent) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Width, value::percent(percent));
}

void YGNodeStyleSetWidthAuto(YGNodeRef node) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Width, value::ofAuto());
}

YGValue YGNodeStyleGetWidth(YGNodeConstRef node) {
  return (YGValue)resolveRef(node)->getStyle().dimension(Dimension::Width);
}

void YGNodeStyleSetHeight(YGNodeRef node, float points) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Height, value::points(points));
}

void YGNodeStyleSetHeightPercent(YGNodeRef node, float percent) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Height, value::percent(percent));
}

void YGNodeStyleSetHeightAuto(YGNodeRef node) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Height, value::ofAuto());
}

YGValue YGNodeStyleGetHeight(YGNodeConstRef node) {
  return (YGValue)resolveRef(node)->getStyle().dimension(Dimension::Height);
}

void YGNodeStyleSetMinWidth(const YGNodeRef node, const float minWidth) {
  updateStyle<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Width, value::points(minWidth));
}

void YGNodeStyleSetMinWidthPercent(const YGNodeRef node, const float minWidth) {
  updateStyle<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Width, value::percent(minWidth));
}

YGValue YGNodeStyleGetMinWidth(const YGNodeConstRef node) {
  return (YGValue)resolveRef(node)->getStyle().minDimension(Dimension::Width);
}

void YGNodeStyleSetMinHeight(const YGNodeRef node, const float minHeight) {
  updateStyle<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Height, value::points(minHeight));
}

void YGNodeStyleSetMinHeightPercent(
    const YGNodeRef node,
    const float minHeight) {
  updateStyle<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Height, value::percent(minHeight));
}

YGValue YGNodeStyleGetMinHeight(const YGNodeConstRef node) {
  return (YGValue)resolveRef(node)->getStyle().minDimension(Dimension::Height);
}

void YGNodeStyleSetMaxWidth(const YGNodeRef node, const float maxWidth) {
  updateStyle<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Width, value::points(maxWidth));
}

void YGNodeStyleSetMaxWidthPercent(const YGNodeRef node, const float maxWidth) {
  updateStyle<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Width, value::percent(maxWidth));
}

YGValue YGNodeStyleGetMaxWidth(const YGNodeConstRef node) {
  return (YGValue)resolveRef(node)->getStyle().maxDimension(Dimension::Width);
}

void YGNodeStyleSetMaxHeight(const YGNodeRef node, const float maxHeight) {
  updateStyle<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Height, value::points(maxHeight));
}

void YGNodeStyleSetMaxHeightPercent(
    const YGNodeRef node,
    const float maxHeight) {
  updateStyle<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Height, value::percent(maxHeight));
}

YGValue YGNodeStyleGetMaxHeight(const YGNodeConstRef node) {
  return (YGValue)resolveRef(node)->getStyle().maxDimension(Dimension::Height);
}
