/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YGNode.h"
#include <algorithm>
#include <iostream>
#include "Utils.h"

using namespace facebook;
using facebook::yoga::detail::CompactValue;

YGNode::YGNode(const YGConfigRef config) : config_{config} {
  YGAssert(
      config != nullptr, "Attempting to construct YGNode with null config");

  flags_.hasNewLayout = true;
  if (config->useWebDefaults()) {
    useWebDefaults();
  }
}

YGNode::YGNode(YGNode&& node) {
  context_ = node.context_;
  flags_ = node.flags_;
  measure_ = node.measure_;
  baseline_ = node.baseline_;
  print_ = node.print_;
  dirtied_ = node.dirtied_;
  style_ = node.style_;
  layout_ = node.layout_;
  lineIndex_ = node.lineIndex_;
  owner_ = node.owner_;
  children_ = std::move(node.children_);
  config_ = node.config_;
  resolvedDimensions_ = node.resolvedDimensions_;
  for (auto c : children_) {
    c->setOwner(this);
  }
}

void YGNode::print(void* printContext) {
  if (print_.noContext != nullptr) {
    if (flags_.printUsesContext) {
      print_.withContext(this, printContext);
    } else {
      print_.noContext(this);
    }
  }
}

CompactValue YGNode::computeEdgeValueForRow(
    const YGStyle::Edges& edges,
    YGEdge rowEdge,
    YGEdge edge,
    CompactValue defaultValue) {
  if (!edges[rowEdge].isUndefined()) {
    return edges[rowEdge];
  } else if (!edges[edge].isUndefined()) {
    return edges[edge];
  } else if (!edges[YGEdgeHorizontal].isUndefined()) {
    return edges[YGEdgeHorizontal];
  } else if (!edges[YGEdgeAll].isUndefined()) {
    return edges[YGEdgeAll];
  } else {
    return defaultValue;
  }
}

CompactValue YGNode::computeEdgeValueForColumn(
    const YGStyle::Edges& edges,
    YGEdge edge,
    CompactValue defaultValue) {
  if (!edges[edge].isUndefined()) {
    return edges[edge];
  } else if (!edges[YGEdgeVertical].isUndefined()) {
    return edges[YGEdgeVertical];
  } else if (!edges[YGEdgeAll].isUndefined()) {
    return edges[YGEdgeAll];
  } else {
    return defaultValue;
  }
}

CompactValue YGNode::computeRowGap(
    const YGStyle::Gutters& gutters,
    CompactValue defaultValue) {
  if (!gutters[YGGutterRow].isUndefined()) {
    return gutters[YGGutterRow];
  } else if (!gutters[YGGutterAll].isUndefined()) {
    return gutters[YGGutterAll];
  } else {
    return defaultValue;
  }
}

CompactValue YGNode::computeColumnGap(
    const YGStyle::Gutters& gutters,
    CompactValue defaultValue) {
  if (!gutters[YGGutterColumn].isUndefined()) {
    return gutters[YGGutterColumn];
  } else if (!gutters[YGGutterAll].isUndefined()) {
    return gutters[YGGutterAll];
  } else {
    return defaultValue;
  }
}

YGFloatOptional YGNode::getLeadingPosition(
    const YGFlexDirection axis,
    const float axisSize) const {
  auto leadingPosition = YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            YGEdgeStart,
            leading[axis],
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.position(), leading[axis], CompactValue::ofZero());
  return YGResolveValue(leadingPosition, axisSize);
}

YGFloatOptional YGNode::getTrailingPosition(
    const YGFlexDirection axis,
    const float axisSize) const {
  auto trailingPosition = YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            YGEdgeEnd,
            trailing[axis],
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.position(), trailing[axis], CompactValue::ofZero());
  return YGResolveValue(trailingPosition, axisSize);
}

bool YGNode::isLeadingPositionDefined(const YGFlexDirection axis) const {
  auto leadingPosition = YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            YGEdgeStart,
            leading[axis],
            CompactValue::ofUndefined())
      : computeEdgeValueForColumn(
            style_.position(), leading[axis], CompactValue::ofUndefined());
  return !leadingPosition.isUndefined();
}

bool YGNode::isTrailingPosDefined(const YGFlexDirection axis) const {
  auto trailingPosition = YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            YGEdgeEnd,
            trailing[axis],
            CompactValue::ofUndefined())
      : computeEdgeValueForColumn(
            style_.position(), trailing[axis], CompactValue::ofUndefined());
  return !trailingPosition.isUndefined();
}

YGFloatOptional YGNode::getLeadingMargin(
    const YGFlexDirection axis,
    const float widthSize) const {
  auto leadingMargin = YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.margin(), YGEdgeStart, leading[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.margin(), leading[axis], CompactValue::ofZero());
  return YGResolveValueMargin(leadingMargin, widthSize);
}

YGFloatOptional YGNode::getTrailingMargin(
    const YGFlexDirection axis,
    const float widthSize) const {
  auto trailingMargin = YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.margin(), YGEdgeEnd, trailing[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.margin(), trailing[axis], CompactValue::ofZero());
  return YGResolveValueMargin(trailingMargin, widthSize);
}

YGFloatOptional YGNode::getMarginForAxis(
    const YGFlexDirection axis,
    const float widthSize) const {
  return getLeadingMargin(axis, widthSize) + getTrailingMargin(axis, widthSize);
}

YGFloatOptional YGNode::getGapForAxis(
    const YGFlexDirection axis,
    const float widthSize) const {
  auto gap = YGFlexDirectionIsRow(axis)
      ? computeColumnGap(style_.gap(), CompactValue::ofZero())
      : computeRowGap(style_.gap(), CompactValue::ofZero());
  return YGResolveValue(gap, widthSize);
}

YGSize YGNode::measure(
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode,
    void* layoutContext) {
  return flags_.measureUsesContext
      ? measure_.withContext(
            this, width, widthMode, height, heightMode, layoutContext)
      : measure_.noContext(this, width, widthMode, height, heightMode);
}

float YGNode::baseline(float width, float height, void* layoutContext) {
  return flags_.baselineUsesContext
      ? baseline_.withContext(this, width, height, layoutContext)
      : baseline_.noContext(this, width, height);
}

// Setters

void YGNode::setMeasureFunc(decltype(YGNode::measure_) measureFunc) {
  if (measureFunc.noContext == nullptr) {
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(YGNodeTypeDefault);
  } else {
    YGAssertWithNode(
        this,
        children_.size() == 0,
        "Cannot set measure function: Nodes with measure functions cannot have "
        "children.");
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(YGNodeTypeText);
  }

  measure_ = measureFunc;
}

void YGNode::setMeasureFunc(YGMeasureFunc measureFunc) {
  flags_.measureUsesContext = false;
  decltype(YGNode::measure_) m;
  m.noContext = measureFunc;
  setMeasureFunc(m);
}

YOGA_EXPORT void YGNode::setMeasureFunc(MeasureWithContextFn measureFunc) {
  flags_.measureUsesContext = true;
  decltype(YGNode::measure_) m;
  m.withContext = measureFunc;
  setMeasureFunc(m);
}

void YGNode::replaceChild(YGNodeRef child, uint32_t index) {
  children_[index] = child;
}

void YGNode::replaceChild(YGNodeRef oldChild, YGNodeRef newChild) {
  std::replace(children_.begin(), children_.end(), oldChild, newChild);
}

void YGNode::insertChild(YGNodeRef child, uint32_t index) {
  children_.insert(children_.begin() + index, child);
}

void YGNode::setConfig(YGConfigRef config) {
  YGAssert(config != nullptr, "Attempting to set a null config on a YGNode");
  YGAssertWithConfig(
      config,
      config->useWebDefaults() == config_->useWebDefaults(),
      "UseWebDefaults may not be changed after constructing a YGNode");

  if (yoga::configUpdateInvalidatesLayout(config_, config)) {
    markDirtyAndPropagate();
  }

  config_ = config;
}

void YGNode::setDirty(bool isDirty) {
  if (isDirty == flags_.isDirty) {
    return;
  }
  flags_.isDirty = isDirty;
  if (isDirty && dirtied_) {
    dirtied_(this);
  }
}

bool YGNode::removeChild(YGNodeRef child) {
  std::vector<YGNodeRef>::iterator p =
      std::find(children_.begin(), children_.end(), child);
  if (p != children_.end()) {
    children_.erase(p);
    return true;
  }
  return false;
}

void YGNode::removeChild(uint32_t index) {
  children_.erase(children_.begin() + index);
}

void YGNode::setLayoutDirection(YGDirection direction) {
  layout_.setDirection(direction);
}

void YGNode::setLayoutMargin(float margin, int index) {
  layout_.margin[index] = margin;
}

void YGNode::setLayoutBorder(float border, int index) {
  layout_.border[index] = border;
}

void YGNode::setLayoutPadding(float padding, int index) {
  layout_.padding[index] = padding;
}

void YGNode::setLayoutLastOwnerDirection(YGDirection direction) {
  layout_.lastOwnerDirection = direction;
}

void YGNode::setLayoutComputedFlexBasis(
    const YGFloatOptional computedFlexBasis) {
  layout_.computedFlexBasis = computedFlexBasis;
}

void YGNode::setLayoutPosition(float position, int index) {
  layout_.position[index] = position;
}

void YGNode::setLayoutComputedFlexBasisGeneration(
    uint32_t computedFlexBasisGeneration) {
  layout_.computedFlexBasisGeneration = computedFlexBasisGeneration;
}

void YGNode::setLayoutMeasuredDimension(float measuredDimension, int index) {
  layout_.measuredDimensions[index] = measuredDimension;
}

void YGNode::setLayoutHadOverflow(bool hadOverflow) {
  layout_.setHadOverflow(hadOverflow);
}

void YGNode::setLayoutDimension(float dimension, int index) {
  layout_.dimensions[index] = dimension;
}

// If both left and right are defined, then use left. Otherwise return +left or
// -right depending on which is defined.
YGFloatOptional YGNode::relativePosition(
    const YGFlexDirection axis,
    const float axisSize) const {
  if (isLeadingPositionDefined(axis)) {
    return getLeadingPosition(axis, axisSize);
  }

  YGFloatOptional trailingPosition = getTrailingPosition(axis, axisSize);
  if (!trailingPosition.isUndefined()) {
    trailingPosition = YGFloatOptional{-1 * trailingPosition.unwrap()};
  }
  return trailingPosition;
}

void YGNode::setPosition(
    const YGDirection direction,
    const float mainSize,
    const float crossSize,
    const float ownerWidth) {
  /* Root nodes should be always layouted as LTR, so we don't return negative
   * values. */
  const YGDirection directionRespectingRoot =
      owner_ != nullptr ? direction : YGDirectionLTR;
  const YGFlexDirection mainAxis =
      YGResolveFlexDirection(style_.flexDirection(), directionRespectingRoot);
  const YGFlexDirection crossAxis =
      YGFlexDirectionCross(mainAxis, directionRespectingRoot);

  // Here we should check for `YGPositionTypeStatic` and in this case zero inset
  // properties (left, right, top, bottom, begin, end).
  // https://www.w3.org/TR/css-position-3/#valdef-position-static
  const YGFloatOptional relativePositionMain =
      relativePosition(mainAxis, mainSize);
  const YGFloatOptional relativePositionCross =
      relativePosition(crossAxis, crossSize);

  setLayoutPosition(
      (getLeadingMargin(mainAxis, ownerWidth) + relativePositionMain).unwrap(),
      leading[mainAxis]);
  setLayoutPosition(
      (getTrailingMargin(mainAxis, ownerWidth) + relativePositionMain).unwrap(),
      trailing[mainAxis]);
  setLayoutPosition(
      (getLeadingMargin(crossAxis, ownerWidth) + relativePositionCross)
          .unwrap(),
      leading[crossAxis]);
  setLayoutPosition(
      (getTrailingMargin(crossAxis, ownerWidth) + relativePositionCross)
          .unwrap(),
      trailing[crossAxis]);
}

YGValue YGNode::marginLeadingValue(const YGFlexDirection axis) const {
  if (YGFlexDirectionIsRow(axis) &&
      !style_.margin()[YGEdgeStart].isUndefined()) {
    return style_.margin()[YGEdgeStart];
  } else {
    return style_.margin()[leading[axis]];
  }
}

YGValue YGNode::marginTrailingValue(const YGFlexDirection axis) const {
  if (YGFlexDirectionIsRow(axis) && !style_.margin()[YGEdgeEnd].isUndefined()) {
    return style_.margin()[YGEdgeEnd];
  } else {
    return style_.margin()[trailing[axis]];
  }
}

YGValue YGNode::resolveFlexBasisPtr() const {
  YGValue flexBasis = style_.flexBasis();
  if (flexBasis.unit != YGUnitAuto && flexBasis.unit != YGUnitUndefined) {
    return flexBasis;
  }
  if (!style_.flex().isUndefined() && style_.flex().unwrap() > 0.0f) {
    return config_->useWebDefaults() ? YGValueAuto : YGValueZero;
  }
  return YGValueAuto;
}

void YGNode::resolveDimension() {
  using namespace yoga;
  const YGStyle& style = getStyle();
  for (auto dim : {YGDimensionWidth, YGDimensionHeight}) {
    if (!style.maxDimensions()[dim].isUndefined() &&
        YGValueEqual(style.maxDimensions()[dim], style.minDimensions()[dim])) {
      resolvedDimensions_[dim] = style.maxDimensions()[dim];
    } else {
      resolvedDimensions_[dim] = style.dimensions()[dim];
    }
  }
}

YGDirection YGNode::resolveDirection(const YGDirection ownerDirection) {
  if (style_.direction() == YGDirectionInherit) {
    return ownerDirection > YGDirectionInherit ? ownerDirection
                                               : YGDirectionLTR;
  } else {
    return style_.direction();
  }
}

YOGA_EXPORT void YGNode::clearChildren() {
  children_.clear();
  children_.shrink_to_fit();
}

// Other Methods

void YGNode::cloneChildrenIfNeeded(void* cloneContext) {
  iterChildrenAfterCloningIfNeeded([](YGNodeRef, void*) {}, cloneContext);
}

void YGNode::markDirtyAndPropagate() {
  if (!flags_.isDirty) {
    setDirty(true);
    setLayoutComputedFlexBasis(YGFloatOptional());
    if (owner_) {
      owner_->markDirtyAndPropagate();
    }
  }
}

void YGNode::markDirtyAndPropagateDownwards() {
  flags_.isDirty = true;
  for_each(children_.begin(), children_.end(), [](YGNodeRef childNode) {
    childNode->markDirtyAndPropagateDownwards();
  });
}

float YGNode::resolveFlexGrow() const {
  // Root nodes flexGrow should always be 0
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (!style_.flexGrow().isUndefined()) {
    return style_.flexGrow().unwrap();
  }
  if (!style_.flex().isUndefined() && style_.flex().unwrap() > 0.0f) {
    return style_.flex().unwrap();
  }
  return kDefaultFlexGrow;
}

float YGNode::resolveFlexShrink() const {
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (!style_.flexShrink().isUndefined()) {
    return style_.flexShrink().unwrap();
  }
  if (!config_->useWebDefaults() && !style_.flex().isUndefined() &&
      style_.flex().unwrap() < 0.0f) {
    return -style_.flex().unwrap();
  }
  return config_->useWebDefaults() ? kWebDefaultFlexShrink : kDefaultFlexShrink;
}

bool YGNode::isNodeFlexible() {
  return (
      (style_.positionType() != YGPositionTypeAbsolute) &&
      (resolveFlexGrow() != 0 || resolveFlexShrink() != 0));
}

float YGNode::getLeadingBorder(const YGFlexDirection axis) const {
  YGValue leadingBorder = YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.border(), YGEdgeStart, leading[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.border(), leading[axis], CompactValue::ofZero());
  return fmaxf(leadingBorder.value, 0.0f);
}

float YGNode::getTrailingBorder(const YGFlexDirection axis) const {
  YGValue trailingBorder = YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.border(), YGEdgeEnd, trailing[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.border(), trailing[axis], CompactValue::ofZero());
  return fmaxf(trailingBorder.value, 0.0f);
}

YGFloatOptional YGNode::getLeadingPadding(
    const YGFlexDirection axis,
    const float widthSize) const {
  auto leadingPadding = YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.padding(),
            YGEdgeStart,
            leading[axis],
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.padding(), leading[axis], CompactValue::ofZero());
  return YGFloatOptionalMax(
      YGResolveValue(leadingPadding, widthSize), YGFloatOptional(0.0f));
}

YGFloatOptional YGNode::getTrailingPadding(
    const YGFlexDirection axis,
    const float widthSize) const {
  auto trailingPadding = YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.padding(), YGEdgeEnd, trailing[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.padding(), trailing[axis], CompactValue::ofZero());
  return YGFloatOptionalMax(
      YGResolveValue(trailingPadding, widthSize), YGFloatOptional(0.0f));
}

YGFloatOptional YGNode::getLeadingPaddingAndBorder(
    const YGFlexDirection axis,
    const float widthSize) const {
  return getLeadingPadding(axis, widthSize) +
      YGFloatOptional(getLeadingBorder(axis));
}

YGFloatOptional YGNode::getTrailingPaddingAndBorder(
    const YGFlexDirection axis,
    const float widthSize) const {
  return getTrailingPadding(axis, widthSize) +
      YGFloatOptional(getTrailingBorder(axis));
}

void YGNode::reset() {
  YGAssertWithNode(
      this,
      children_.size() == 0,
      "Cannot reset a node which still has children attached");
  YGAssertWithNode(
      this, owner_ == nullptr, "Cannot reset a node still attached to a owner");

  *this = YGNode{getConfig()};
}
