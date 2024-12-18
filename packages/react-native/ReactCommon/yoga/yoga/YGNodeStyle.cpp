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
  auto& style = resolveRef(node)->style();
  if ((style.*GetterT)() != value) {
    (style.*SetterT)(value);
    resolveRef(node)->markDirtyAndPropagate();
  }
}

template <auto GetterT, auto SetterT, typename IdxT, typename ValueT>
void updateStyle(YGNodeRef node, IdxT idx, ValueT value) {
  auto& style = resolveRef(node)->style();
  if ((style.*GetterT)(idx) != value) {
    (style.*SetterT)(idx, value);
    resolveRef(node)->markDirtyAndPropagate();
  }
}

} // namespace

void YGNodeCopyStyle(YGNodeRef dstNode, YGNodeConstRef srcNode) {
  auto dst = resolveRef(dstNode);
  auto src = resolveRef(srcNode);

  if (dst->style() != src->style()) {
    dst->setStyle(src->style());
    dst->markDirtyAndPropagate();
  }
}

void YGNodeStyleSetDirection(const YGNodeRef node, const YGDirection value) {
  updateStyle<&Style::direction, &Style::setDirection>(node, scopedEnum(value));
}

YGDirection YGNodeStyleGetDirection(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->style().direction());
}

void YGNodeStyleSetFlexDirection(
    const YGNodeRef node,
    const YGFlexDirection flexDirection) {
  updateStyle<&Style::flexDirection, &Style::setFlexDirection>(
      node, scopedEnum(flexDirection));
}

YGFlexDirection YGNodeStyleGetFlexDirection(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->style().flexDirection());
}

void YGNodeStyleSetJustifyContent(
    const YGNodeRef node,
    const YGJustify justifyContent) {
  updateStyle<&Style::justifyContent, &Style::setJustifyContent>(
      node, scopedEnum(justifyContent));
}

YGJustify YGNodeStyleGetJustifyContent(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->style().justifyContent());
}

void YGNodeStyleSetAlignContent(
    const YGNodeRef node,
    const YGAlign alignContent) {
  updateStyle<&Style::alignContent, &Style::setAlignContent>(
      node, scopedEnum(alignContent));
}

YGAlign YGNodeStyleGetAlignContent(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->style().alignContent());
}

void YGNodeStyleSetAlignItems(const YGNodeRef node, const YGAlign alignItems) {
  updateStyle<&Style::alignItems, &Style::setAlignItems>(
      node, scopedEnum(alignItems));
}

YGAlign YGNodeStyleGetAlignItems(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->style().alignItems());
}

void YGNodeStyleSetAlignSelf(const YGNodeRef node, const YGAlign alignSelf) {
  updateStyle<&Style::alignSelf, &Style::setAlignSelf>(
      node, scopedEnum(alignSelf));
}

YGAlign YGNodeStyleGetAlignSelf(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->style().alignSelf());
}

void YGNodeStyleSetPositionType(
    const YGNodeRef node,
    const YGPositionType positionType) {
  updateStyle<&Style::positionType, &Style::setPositionType>(
      node, scopedEnum(positionType));
}

YGPositionType YGNodeStyleGetPositionType(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->style().positionType());
}

void YGNodeStyleSetFlexWrap(const YGNodeRef node, const YGWrap flexWrap) {
  updateStyle<&Style::flexWrap, &Style::setFlexWrap>(
      node, scopedEnum(flexWrap));
}

YGWrap YGNodeStyleGetFlexWrap(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->style().flexWrap());
}

void YGNodeStyleSetOverflow(const YGNodeRef node, const YGOverflow overflow) {
  updateStyle<&Style::overflow, &Style::setOverflow>(
      node, scopedEnum(overflow));
}

YGOverflow YGNodeStyleGetOverflow(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->style().overflow());
}

void YGNodeStyleSetDisplay(const YGNodeRef node, const YGDisplay display) {
  updateStyle<&Style::display, &Style::setDisplay>(node, scopedEnum(display));
}

YGDisplay YGNodeStyleGetDisplay(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->style().display());
}

void YGNodeStyleSetFlex(const YGNodeRef node, const float flex) {
  updateStyle<&Style::flex, &Style::setFlex>(node, FloatOptional{flex});
}

float YGNodeStyleGetFlex(const YGNodeConstRef nodeRef) {
  const auto node = resolveRef(nodeRef);
  return node->style().flex().isUndefined() ? YGUndefined
                                            : node->style().flex().unwrap();
}

void YGNodeStyleSetFlexGrow(const YGNodeRef node, const float flexGrow) {
  updateStyle<&Style::flexGrow, &Style::setFlexGrow>(
      node, FloatOptional{flexGrow});
}

float YGNodeStyleGetFlexGrow(const YGNodeConstRef nodeRef) {
  const auto node = resolveRef(nodeRef);
  return node->style().flexGrow().isUndefined()
      ? Style::DefaultFlexGrow
      : node->style().flexGrow().unwrap();
}

void YGNodeStyleSetFlexShrink(const YGNodeRef node, const float flexShrink) {
  updateStyle<&Style::flexShrink, &Style::setFlexShrink>(
      node, FloatOptional{flexShrink});
}

float YGNodeStyleGetFlexShrink(const YGNodeConstRef nodeRef) {
  const auto node = resolveRef(nodeRef);
  return node->style().flexShrink().isUndefined()
      ? (node->getConfig()->useWebDefaults() ? Style::WebDefaultFlexShrink
                                             : Style::DefaultFlexShrink)
      : node->style().flexShrink().unwrap();
}

void YGNodeStyleSetFlexBasis(const YGNodeRef node, const float flexBasis) {
  updateStyle<&Style::flexBasis, &Style::setFlexBasis>(
      node, StyleSizeLength::points(flexBasis));
}

void YGNodeStyleSetFlexBasisPercent(
    const YGNodeRef node,
    const float flexBasisPercent) {
  updateStyle<&Style::flexBasis, &Style::setFlexBasis>(
      node, StyleSizeLength::percent(flexBasisPercent));
}

void YGNodeStyleSetFlexBasisAuto(const YGNodeRef node) {
  updateStyle<&Style::flexBasis, &Style::setFlexBasis>(
      node, StyleSizeLength::ofAuto());
}

void YGNodeStyleSetFlexBasisMaxContent(const YGNodeRef node) {
  updateStyle<&Style::flexBasis, &Style::setFlexBasis>(
      node, StyleSizeLength::ofMaxContent());
}

void YGNodeStyleSetFlexBasisFitContent(const YGNodeRef node) {
  updateStyle<&Style::flexBasis, &Style::setFlexBasis>(
      node, StyleSizeLength::ofFitContent());
}

void YGNodeStyleSetFlexBasisStretch(const YGNodeRef node) {
  updateStyle<&Style::flexBasis, &Style::setFlexBasis>(
      node, StyleSizeLength::ofStretch());
}

YGValue YGNodeStyleGetFlexBasis(const YGNodeConstRef node) {
  return (YGValue)resolveRef(node)->style().flexBasis();
}

void YGNodeStyleSetPosition(YGNodeRef node, YGEdge edge, float points) {
  updateStyle<&Style::position, &Style::setPosition>(
      node, scopedEnum(edge), StyleLength::points(points));
}

void YGNodeStyleSetPositionPercent(YGNodeRef node, YGEdge edge, float percent) {
  updateStyle<&Style::position, &Style::setPosition>(
      node, scopedEnum(edge), StyleLength::percent(percent));
}

void YGNodeStyleSetPositionAuto(YGNodeRef node, YGEdge edge) {
  updateStyle<&Style::position, &Style::setPosition>(
      node, scopedEnum(edge), StyleLength::ofAuto());
}

YGValue YGNodeStyleGetPosition(YGNodeConstRef node, YGEdge edge) {
  return (YGValue)resolveRef(node)->style().position(scopedEnum(edge));
}

void YGNodeStyleSetMargin(YGNodeRef node, YGEdge edge, float points) {
  updateStyle<&Style::margin, &Style::setMargin>(
      node, scopedEnum(edge), StyleLength::points(points));
}

void YGNodeStyleSetMarginPercent(YGNodeRef node, YGEdge edge, float percent) {
  updateStyle<&Style::margin, &Style::setMargin>(
      node, scopedEnum(edge), StyleLength::percent(percent));
}

void YGNodeStyleSetMarginAuto(YGNodeRef node, YGEdge edge) {
  updateStyle<&Style::margin, &Style::setMargin>(
      node, scopedEnum(edge), StyleLength::ofAuto());
}

YGValue YGNodeStyleGetMargin(YGNodeConstRef node, YGEdge edge) {
  return (YGValue)resolveRef(node)->style().margin(scopedEnum(edge));
}

void YGNodeStyleSetPadding(YGNodeRef node, YGEdge edge, float points) {
  updateStyle<&Style::padding, &Style::setPadding>(
      node, scopedEnum(edge), StyleLength::points(points));
}

void YGNodeStyleSetPaddingPercent(YGNodeRef node, YGEdge edge, float percent) {
  updateStyle<&Style::padding, &Style::setPadding>(
      node, scopedEnum(edge), StyleLength::percent(percent));
}

YGValue YGNodeStyleGetPadding(YGNodeConstRef node, YGEdge edge) {
  return (YGValue)resolveRef(node)->style().padding(scopedEnum(edge));
}

void YGNodeStyleSetBorder(
    const YGNodeRef node,
    const YGEdge edge,
    const float border) {
  updateStyle<&Style::border, &Style::setBorder>(
      node, scopedEnum(edge), StyleLength::points(border));
}

float YGNodeStyleGetBorder(const YGNodeConstRef node, const YGEdge edge) {
  auto border = resolveRef(node)->style().border(scopedEnum(edge));
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
      node, scopedEnum(gutter), StyleLength::points(gapLength));
}

void YGNodeStyleSetGapPercent(YGNodeRef node, YGGutter gutter, float percent) {
  updateStyle<&Style::gap, &Style::setGap>(
      node, scopedEnum(gutter), StyleLength::percent(percent));
}

YGValue YGNodeStyleGetGap(const YGNodeConstRef node, const YGGutter gutter) {
  return (YGValue)resolveRef(node)->style().gap(scopedEnum(gutter));
}

void YGNodeStyleSetAspectRatio(const YGNodeRef node, const float aspectRatio) {
  updateStyle<&Style::aspectRatio, &Style::setAspectRatio>(
      node, FloatOptional{aspectRatio});
}

float YGNodeStyleGetAspectRatio(const YGNodeConstRef node) {
  const FloatOptional op = resolveRef(node)->style().aspectRatio();
  return op.isUndefined() ? YGUndefined : op.unwrap();
}

void YGNodeStyleSetBoxSizing(YGNodeRef node, YGBoxSizing boxSizing) {
  updateStyle<&Style::boxSizing, &Style::setBoxSizing>(
      node, scopedEnum(boxSizing));
}

YGBoxSizing YGNodeStyleGetBoxSizing(const YGNodeConstRef node) {
  return unscopedEnum(resolveRef(node)->style().boxSizing());
}

void YGNodeStyleSetWidth(YGNodeRef node, float points) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Width, StyleSizeLength::points(points));
}

void YGNodeStyleSetWidthPercent(YGNodeRef node, float percent) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Width, StyleSizeLength::percent(percent));
}

void YGNodeStyleSetWidthAuto(YGNodeRef node) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Width, StyleSizeLength::ofAuto());
}

void YGNodeStyleSetWidthMaxContent(YGNodeRef node) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Width, StyleSizeLength::ofMaxContent());
}

void YGNodeStyleSetWidthFitContent(YGNodeRef node) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Width, StyleSizeLength::ofFitContent());
}

void YGNodeStyleSetWidthStretch(YGNodeRef node) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Width, StyleSizeLength::ofStretch());
}

YGValue YGNodeStyleGetWidth(YGNodeConstRef node) {
  return (YGValue)resolveRef(node)->style().dimension(Dimension::Width);
}

void YGNodeStyleSetHeight(YGNodeRef node, float points) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Height, StyleSizeLength::points(points));
}

void YGNodeStyleSetHeightPercent(YGNodeRef node, float percent) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Height, StyleSizeLength::percent(percent));
}

void YGNodeStyleSetHeightAuto(YGNodeRef node) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Height, StyleSizeLength::ofAuto());
}

void YGNodeStyleSetHeightMaxContent(YGNodeRef node) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Height, StyleSizeLength::ofMaxContent());
}

void YGNodeStyleSetHeightFitContent(YGNodeRef node) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Height, StyleSizeLength::ofFitContent());
}

void YGNodeStyleSetHeightStretch(YGNodeRef node) {
  updateStyle<&Style::dimension, &Style::setDimension>(
      node, Dimension::Height, StyleSizeLength::ofStretch());
}

YGValue YGNodeStyleGetHeight(YGNodeConstRef node) {
  return (YGValue)resolveRef(node)->style().dimension(Dimension::Height);
}

void YGNodeStyleSetMinWidth(const YGNodeRef node, const float minWidth) {
  updateStyle<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Width, StyleSizeLength::points(minWidth));
}

void YGNodeStyleSetMinWidthPercent(const YGNodeRef node, const float minWidth) {
  updateStyle<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Width, StyleSizeLength::percent(minWidth));
}

void YGNodeStyleSetMinWidthMaxContent(const YGNodeRef node) {
  updateStyle<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Width, StyleSizeLength::ofMaxContent());
}

void YGNodeStyleSetMinWidthFitContent(const YGNodeRef node) {
  updateStyle<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Width, StyleSizeLength::ofFitContent());
}

void YGNodeStyleSetMinWidthStretch(const YGNodeRef node) {
  updateStyle<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Width, StyleSizeLength::ofStretch());
}

YGValue YGNodeStyleGetMinWidth(const YGNodeConstRef node) {
  return (YGValue)resolveRef(node)->style().minDimension(Dimension::Width);
}

void YGNodeStyleSetMinHeight(const YGNodeRef node, const float minHeight) {
  updateStyle<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Height, StyleSizeLength::points(minHeight));
}

void YGNodeStyleSetMinHeightPercent(
    const YGNodeRef node,
    const float minHeight) {
  updateStyle<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Height, StyleSizeLength::percent(minHeight));
}

void YGNodeStyleSetMinHeightMaxContent(const YGNodeRef node) {
  updateStyle<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Height, StyleSizeLength::ofMaxContent());
}

void YGNodeStyleSetMinHeightFitContent(const YGNodeRef node) {
  updateStyle<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Height, StyleSizeLength::ofFitContent());
}

void YGNodeStyleSetMinHeightStretch(const YGNodeRef node) {
  updateStyle<&Style::minDimension, &Style::setMinDimension>(
      node, Dimension::Height, StyleSizeLength::ofStretch());
}

YGValue YGNodeStyleGetMinHeight(const YGNodeConstRef node) {
  return (YGValue)resolveRef(node)->style().minDimension(Dimension::Height);
}

void YGNodeStyleSetMaxWidth(const YGNodeRef node, const float maxWidth) {
  updateStyle<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Width, StyleSizeLength::points(maxWidth));
}

void YGNodeStyleSetMaxWidthPercent(const YGNodeRef node, const float maxWidth) {
  updateStyle<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Width, StyleSizeLength::percent(maxWidth));
}

void YGNodeStyleSetMaxWidthMaxContent(const YGNodeRef node) {
  updateStyle<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Width, StyleSizeLength::ofMaxContent());
}

void YGNodeStyleSetMaxWidthFitContent(const YGNodeRef node) {
  updateStyle<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Width, StyleSizeLength::ofFitContent());
}

void YGNodeStyleSetMaxWidthStretch(const YGNodeRef node) {
  updateStyle<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Width, StyleSizeLength::ofStretch());
}

YGValue YGNodeStyleGetMaxWidth(const YGNodeConstRef node) {
  return (YGValue)resolveRef(node)->style().maxDimension(Dimension::Width);
}

void YGNodeStyleSetMaxHeight(const YGNodeRef node, const float maxHeight) {
  updateStyle<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Height, StyleSizeLength::points(maxHeight));
}

void YGNodeStyleSetMaxHeightPercent(
    const YGNodeRef node,
    const float maxHeight) {
  updateStyle<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Height, StyleSizeLength::percent(maxHeight));
}

void YGNodeStyleSetMaxHeightMaxContent(const YGNodeRef node) {
  updateStyle<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Height, StyleSizeLength::ofMaxContent());
}

void YGNodeStyleSetMaxHeightFitContent(const YGNodeRef node) {
  updateStyle<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Height, StyleSizeLength::ofFitContent());
}

void YGNodeStyleSetMaxHeightStretch(const YGNodeRef node) {
  updateStyle<&Style::maxDimension, &Style::setMaxDimension>(
      node, Dimension::Height, StyleSizeLength::ofStretch());
}

YGValue YGNodeStyleGetMaxHeight(const YGNodeConstRef node) {
  return (YGValue)resolveRef(node)->style().maxDimension(Dimension::Height);
}
