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

template <typename T, typename NeedsUpdate, typename Update>
void updateStyle(
    yoga::Node* node,
    T value,
    NeedsUpdate&& needsUpdate,
    Update&& update) {
  if (needsUpdate(node->getStyle(), value)) {
    update(node->getStyle(), value);
    node->markDirtyAndPropagate();
  }
}

template <typename Ref, typename T>
void updateStyle(YGNodeRef node, Ref (Style::*prop)(), T value) {
  updateStyle(
      resolveRef(node),
      value,
      [prop](Style& s, T x) { return (s.*prop)() != x; },
      [prop](Style& s, T x) { (s.*prop)() = x; });
}

template <typename Ref, typename Idx>
void updateIndexedStyleProp(
    YGNodeRef node,
    Ref (Style::*prop)(),
    Idx idx,
    CompactValue value) {
  updateStyle(
      resolveRef(node),
      value,
      [idx, prop](Style& s, CompactValue x) { return (s.*prop)()[idx] != x; },
      [idx, prop](Style& s, CompactValue x) { (s.*prop)()[idx] = x; });
}

template <auto GetterT, auto SetterT, typename IdxT>
void updateIndexedStyleProp(YGNodeRef node, IdxT idx, CompactValue value) {
  updateStyle(
      resolveRef(node),
      value,
      [idx](Style& s, CompactValue x) { return (s.*GetterT)(idx) != x; },
      [idx](Style& s, CompactValue x) { (s.*SetterT)(idx, x); });
}

} // namespace

// MSVC has trouble inferring the return type of pointer to member functions
// with const and non-const overloads, instead of preferring the non-const
// overload like clang and GCC. For the purposes of updateStyle(), we can help
// MSVC by specifying that return type explicitly. In combination with
// decltype, MSVC will prefer the non-const version.
#define MSVC_HINT(PROP) decltype(Style{}.PROP())

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
  updateStyle<MSVC_HINT(direction)>(node, &Style::direction, scopedEnum(value));
}

YGDirection YGNodeStyleGetDirection(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().direction());
}

void YGNodeStyleSetFlexDirection(
    const YGNodeRef node,
    const YGFlexDirection flexDirection) {
  updateStyle<MSVC_HINT(flexDirection)>(
      node, &Style::flexDirection, scopedEnum(flexDirection));
}

YGFlexDirection YGNodeStyleGetFlexDirection(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().flexDirection());
}

void YGNodeStyleSetJustifyContent(
    const YGNodeRef node,
    const YGJustify justifyContent) {
  updateStyle<MSVC_HINT(justifyContent)>(
      node, &Style::justifyContent, scopedEnum(justifyContent));
}

YGJustify YGNodeStyleGetJustifyContent(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().justifyContent());
}

void YGNodeStyleSetAlignContent(
    const YGNodeRef node,
    const YGAlign alignContent) {
  updateStyle<MSVC_HINT(alignContent)>(
      node, &Style::alignContent, scopedEnum(alignContent));
}

YGAlign YGNodeStyleGetAlignContent(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().alignContent());
}

void YGNodeStyleSetAlignItems(const YGNodeRef node, const YGAlign alignItems) {
  updateStyle<MSVC_HINT(alignItems)>(
      node, &Style::alignItems, scopedEnum(alignItems));
}

YGAlign YGNodeStyleGetAlignItems(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().alignItems());
}

void YGNodeStyleSetAlignSelf(const YGNodeRef node, const YGAlign alignSelf) {
  updateStyle<MSVC_HINT(alignSelf)>(
      node, &Style::alignSelf, scopedEnum(alignSelf));
}

YGAlign YGNodeStyleGetAlignSelf(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().alignSelf());
}

void YGNodeStyleSetPositionType(
    const YGNodeRef node,
    const YGPositionType positionType) {
  updateStyle<MSVC_HINT(positionType)>(
      node, &Style::positionType, scopedEnum(positionType));
}

YGPositionType YGNodeStyleGetPositionType(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().positionType());
}

void YGNodeStyleSetFlexWrap(const YGNodeRef node, const YGWrap flexWrap) {
  updateStyle<MSVC_HINT(flexWrap)>(
      node, &Style::flexWrap, scopedEnum(flexWrap));
}

YGWrap YGNodeStyleGetFlexWrap(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().flexWrap());
}

void YGNodeStyleSetOverflow(const YGNodeRef node, const YGOverflow overflow) {
  updateStyle<MSVC_HINT(overflow)>(
      node, &Style::overflow, scopedEnum(overflow));
}

YGOverflow YGNodeStyleGetOverflow(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().overflow());
}

void YGNodeStyleSetDisplay(const YGNodeRef node, const YGDisplay display) {
  updateStyle<MSVC_HINT(display)>(node, &Style::display, scopedEnum(display));
}

YGDisplay YGNodeStyleGetDisplay(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->getStyle().display());
}

void YGNodeStyleSetFlex(const YGNodeRef node, const float flex) {
  updateStyle<MSVC_HINT(flex)>(node, &Style::flex, FloatOptional{flex});
}

float YGNodeStyleGetFlex(const YGNodeConstRef nodeRef) {
  const auto node = resolveRef(nodeRef);
  return node->getStyle().flex().isUndefined()
      ? YGUndefined
      : node->getStyle().flex().unwrap();
}

void YGNodeStyleSetFlexGrow(const YGNodeRef node, const float flexGrow) {
  updateStyle<MSVC_HINT(flexGrow)>(
      node, &Style::flexGrow, FloatOptional{flexGrow});
}

float YGNodeStyleGetFlexGrow(const YGNodeConstRef nodeRef) {
  const auto node = resolveRef(nodeRef);
  return node->getStyle().flexGrow().isUndefined()
      ? Style::DefaultFlexGrow
      : node->getStyle().flexGrow().unwrap();
}

void YGNodeStyleSetFlexShrink(const YGNodeRef node, const float flexShrink) {
  updateStyle<MSVC_HINT(flexShrink)>(
      node, &Style::flexShrink, FloatOptional{flexShrink});
}

float YGNodeStyleGetFlexShrink(const YGNodeConstRef nodeRef) {
  const auto node = resolveRef(nodeRef);
  return node->getStyle().flexShrink().isUndefined()
      ? (node->getConfig()->useWebDefaults() ? Style::WebDefaultFlexShrink
                                             : Style::DefaultFlexShrink)
      : node->getStyle().flexShrink().unwrap();
}

void YGNodeStyleSetFlexBasis(const YGNodeRef node, const float flexBasis) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(flexBasis);
  updateStyle<MSVC_HINT(flexBasis)>(node, &Style::flexBasis, value);
}

void YGNodeStyleSetFlexBasisPercent(
    const YGNodeRef node,
    const float flexBasisPercent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(flexBasisPercent);
  updateStyle<MSVC_HINT(flexBasis)>(node, &Style::flexBasis, value);
}

void YGNodeStyleSetFlexBasisAuto(const YGNodeRef node) {
  updateStyle<MSVC_HINT(flexBasis)>(
      node, &Style::flexBasis, CompactValue::ofAuto());
}

YGValue YGNodeStyleGetFlexBasis(const YGNodeConstRef node) {
  YGValue flexBasis = resolveRef(node)->getStyle().flexBasis();
  if (flexBasis.unit == YGUnitUndefined || flexBasis.unit == YGUnitAuto) {
    flexBasis.value = YGUndefined;
  }
  return flexBasis;
}

void YGNodeStyleSetPosition(YGNodeRef node, YGEdge edge, float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(position)>(
      node, &Style::position, edge, value);
}

void YGNodeStyleSetPositionPercent(YGNodeRef node, YGEdge edge, float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(position)>(
      node, &Style::position, edge, value);
}

YGValue YGNodeStyleGetPosition(YGNodeConstRef node, YGEdge edge) {
  return resolveRef(node)->getStyle().position()[edge];
}

void YGNodeStyleSetMargin(YGNodeRef node, YGEdge edge, float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(margin)>(node, &Style::margin, edge, value);
}

void YGNodeStyleSetMarginPercent(YGNodeRef node, YGEdge edge, float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(margin)>(node, &Style::margin, edge, value);
}

void YGNodeStyleSetMarginAuto(YGNodeRef node, YGEdge edge) {
  updateIndexedStyleProp<MSVC_HINT(margin)>(
      node, &Style::margin, edge, CompactValue::ofAuto());
}

YGValue YGNodeStyleGetMargin(YGNodeConstRef node, YGEdge edge) {
  return resolveRef(node)->getStyle().margin()[edge];
}

void YGNodeStyleSetPadding(YGNodeRef node, YGEdge edge, float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<MSVC_HINT(padding)>(
      node, &Style::padding, edge, value);
}

void YGNodeStyleSetPaddingPercent(YGNodeRef node, YGEdge edge, float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<MSVC_HINT(padding)>(
      node, &Style::padding, edge, value);
}

YGValue YGNodeStyleGetPadding(YGNodeConstRef node, YGEdge edge) {
  return resolveRef(node)->getStyle().padding()[edge];
}

void YGNodeStyleSetBorder(
    const YGNodeRef node,
    const YGEdge edge,
    const float border) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(border);
  updateIndexedStyleProp<MSVC_HINT(border)>(node, &Style::border, edge, value);
}

float YGNodeStyleGetBorder(const YGNodeConstRef node, const YGEdge edge) {
  auto border = resolveRef(node)->getStyle().border()[edge];
  if (border.isUndefined() || border.isAuto()) {
    return YGUndefined;
  }

  return static_cast<YGValue>(border).value;
}

void YGNodeStyleSetGap(
    const YGNodeRef node,
    const YGGutter gutter,
    const float gapLength) {
  auto length = CompactValue::ofMaybe<YGUnitPoint>(gapLength);
  updateIndexedStyleProp<&Style::gap, &Style::setGap>(
      node, scopedEnum(gutter), length);
}

float YGNodeStyleGetGap(const YGNodeConstRef node, const YGGutter gutter) {
  auto gapLength = resolveRef(node)->getStyle().gap(scopedEnum(gutter));
  if (gapLength.isUndefined() || gapLength.isAuto()) {
    return YGUndefined;
  }

  return static_cast<YGValue>(gapLength).value;
}

void YGNodeStyleSetAspectRatio(const YGNodeRef node, const float aspectRatio) {
  updateStyle<MSVC_HINT(aspectRatio)>(
      node, &Style::aspectRatio, FloatOptional{aspectRatio});
}

float YGNodeStyleGetAspectRatio(const YGNodeConstRef node) {
  const FloatOptional op = resolveRef(node)->getStyle().aspectRatio();
  return op.isUndefined() ? YGUndefined : op.unwrap();
}

void YGNodeStyleSetWidth(YGNodeRef node, float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<&Style::dimension, &Style::setDimension>(
      node, Dimension::Width, value);
}

void YGNodeStyleSetWidthPercent(YGNodeRef node, float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<&Style::dimension, &Style::setDimension>(
      node, Dimension::Width, value);
}

void YGNodeStyleSetWidthAuto(YGNodeRef node) {
  updateIndexedStyleProp<&Style::dimension, &Style::setDimension>(
      node, Dimension::Width, CompactValue::ofAuto());
}

YGValue YGNodeStyleGetWidth(YGNodeConstRef node) {
  return resolveRef(node)->getStyle().dimension(Dimension::Width);
}

void YGNodeStyleSetHeight(YGNodeRef node, float points) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(points);
  updateIndexedStyleProp<&Style::dimension, &Style::setDimension>(
      node, Dimension::Height, value);
}

void YGNodeStyleSetHeightPercent(YGNodeRef node, float percent) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(percent);
  updateIndexedStyleProp<&Style::dimension, &Style::setDimension>(
      node, Dimension::Height, value);
}

void YGNodeStyleSetHeightAuto(YGNodeRef node) {
  updateIndexedStyleProp<&Style::dimension, &Style::setDimension>(
      node, Dimension::Height, CompactValue::ofAuto());
}

YGValue YGNodeStyleGetHeight(YGNodeConstRef node) {
  return resolveRef(node)->getStyle().dimension(Dimension::Height);
}

void YGNodeStyleSetMinWidth(const YGNodeRef node, const float minWidth) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(minWidth);
  updateIndexedStyleProp<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Width, value);
}

void YGNodeStyleSetMinWidthPercent(const YGNodeRef node, const float minWidth) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(minWidth);
  updateIndexedStyleProp<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Width, value);
}

YGValue YGNodeStyleGetMinWidth(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().minDimension(Dimension::Width);
}

void YGNodeStyleSetMinHeight(const YGNodeRef node, const float minHeight) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(minHeight);
  updateIndexedStyleProp<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Height, value);
}

void YGNodeStyleSetMinHeightPercent(
    const YGNodeRef node,
    const float minHeight) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(minHeight);
  updateIndexedStyleProp<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Height, value);
}

YGValue YGNodeStyleGetMinHeight(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().minDimension(Dimension::Height);
}

void YGNodeStyleSetMaxWidth(const YGNodeRef node, const float maxWidth) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(maxWidth);
  updateIndexedStyleProp<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Width, value);
}

void YGNodeStyleSetMaxWidthPercent(const YGNodeRef node, const float maxWidth) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(maxWidth);
  updateIndexedStyleProp<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Width, value);
}

YGValue YGNodeStyleGetMaxWidth(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().maxDimension(Dimension::Width);
}

void YGNodeStyleSetMaxHeight(const YGNodeRef node, const float maxHeight) {
  auto value = CompactValue::ofMaybe<YGUnitPoint>(maxHeight);
  updateIndexedStyleProp<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Height, value);
}

void YGNodeStyleSetMaxHeightPercent(
    const YGNodeRef node,
    const float maxHeight) {
  auto value = CompactValue::ofMaybe<YGUnitPercent>(maxHeight);
  updateIndexedStyleProp<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Height, value);
}

YGValue YGNodeStyleGetMaxHeight(const YGNodeConstRef node) {
  return resolveRef(node)->getStyle().maxDimension(Dimension::Height);
}
