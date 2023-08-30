/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/node/Node.h>
#include <algorithm>
#include <iostream>
#include <yoga/Utils.h>

namespace facebook::yoga {

Node::Node(yoga::Config* config) : config_{config} {
  YGAssert(config != nullptr, "Attempting to construct Node with null config");

  flags_.hasNewLayout = true;
  if (config->useWebDefaults()) {
    useWebDefaults();
  }
}

Node::Node(Node&& node) {
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

void Node::print(void* printContext) {
  if (print_.noContext != nullptr) {
    if (flags_.printUsesContext) {
      print_.withContext(this, printContext);
    } else {
      print_.noContext(this);
    }
  }
}

CompactValue Node::computeEdgeValueForRow(
    const Style::Edges& edges,
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

CompactValue Node::computeEdgeValueForColumn(
    const Style::Edges& edges,
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

CompactValue Node::computeRowGap(
    const Style::Gutters& gutters,
    CompactValue defaultValue) {
  if (!gutters[YGGutterRow].isUndefined()) {
    return gutters[YGGutterRow];
  } else if (!gutters[YGGutterAll].isUndefined()) {
    return gutters[YGGutterAll];
  } else {
    return defaultValue;
  }
}

CompactValue Node::computeColumnGap(
    const Style::Gutters& gutters,
    CompactValue defaultValue) {
  if (!gutters[YGGutterColumn].isUndefined()) {
    return gutters[YGGutterColumn];
  } else if (!gutters[YGGutterAll].isUndefined()) {
    return gutters[YGGutterAll];
  } else {
    return defaultValue;
  }
}

YGFloatOptional Node::getLeadingPosition(
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

YGFloatOptional Node::getTrailingPosition(
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

bool Node::isLeadingPositionDefined(const YGFlexDirection axis) const {
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

bool Node::isTrailingPosDefined(const YGFlexDirection axis) const {
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

YGFloatOptional Node::getLeadingMargin(
    const YGFlexDirection axis,
    const float widthSize) const {
  auto leadingMargin = YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.margin(), YGEdgeStart, leading[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.margin(), leading[axis], CompactValue::ofZero());
  return YGResolveValueMargin(leadingMargin, widthSize);
}

YGFloatOptional Node::getTrailingMargin(
    const YGFlexDirection axis,
    const float widthSize) const {
  auto trailingMargin = YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.margin(), YGEdgeEnd, trailing[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.margin(), trailing[axis], CompactValue::ofZero());
  return YGResolveValueMargin(trailingMargin, widthSize);
}

YGFloatOptional Node::getMarginForAxis(
    const YGFlexDirection axis,
    const float widthSize) const {
  return getLeadingMargin(axis, widthSize) + getTrailingMargin(axis, widthSize);
}

YGFloatOptional Node::getGapForAxis(
    const YGFlexDirection axis,
    const float widthSize) const {
  auto gap = YGFlexDirectionIsRow(axis)
      ? computeColumnGap(style_.gap(), CompactValue::ofZero())
      : computeRowGap(style_.gap(), CompactValue::ofZero());
  return YGResolveValue(gap, widthSize);
}

YGSize Node::measure(
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

float Node::baseline(float width, float height, void* layoutContext) {
  return flags_.baselineUsesContext
      ? baseline_.withContext(this, width, height, layoutContext)
      : baseline_.noContext(this, width, height);
}

// Setters

void Node::setMeasureFunc(decltype(Node::measure_) measureFunc) {
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

void Node::setMeasureFunc(YGMeasureFunc measureFunc) {
  flags_.measureUsesContext = false;
  decltype(Node::measure_) m;
  m.noContext = measureFunc;
  setMeasureFunc(m);
}

YOGA_EXPORT void Node::setMeasureFunc(MeasureWithContextFn measureFunc) {
  flags_.measureUsesContext = true;
  decltype(Node::measure_) m;
  m.withContext = measureFunc;
  setMeasureFunc(m);
}

void Node::replaceChild(Node* child, uint32_t index) {
  children_[index] = child;
}

void Node::replaceChild(Node* oldChild, Node* newChild) {
  std::replace(children_.begin(), children_.end(), oldChild, newChild);
}

void Node::insertChild(Node* child, uint32_t index) {
  children_.insert(children_.begin() + index, child);
}

void Node::setConfig(yoga::Config* config) {
  YGAssert(config != nullptr, "Attempting to set a null config on a Node");
  YGAssertWithConfig(
      config,
      config->useWebDefaults() == config_->useWebDefaults(),
      "UseWebDefaults may not be changed after constructing a Node");

  if (yoga::configUpdateInvalidatesLayout(config_, config)) {
    markDirtyAndPropagate();
  }

  config_ = config;
}

void Node::setDirty(bool isDirty) {
  if (isDirty == flags_.isDirty) {
    return;
  }
  flags_.isDirty = isDirty;
  if (isDirty && dirtied_) {
    dirtied_(this);
  }
}

bool Node::removeChild(Node* child) {
  std::vector<Node*>::iterator p =
      std::find(children_.begin(), children_.end(), child);
  if (p != children_.end()) {
    children_.erase(p);
    return true;
  }
  return false;
}

void Node::removeChild(uint32_t index) {
  children_.erase(children_.begin() + index);
}

void Node::setLayoutDirection(YGDirection direction) {
  layout_.setDirection(direction);
}

void Node::setLayoutMargin(float margin, int index) {
  layout_.margin[index] = margin;
}

void Node::setLayoutBorder(float border, int index) {
  layout_.border[index] = border;
}

void Node::setLayoutPadding(float padding, int index) {
  layout_.padding[index] = padding;
}

void Node::setLayoutLastOwnerDirection(YGDirection direction) {
  layout_.lastOwnerDirection = direction;
}

void Node::setLayoutComputedFlexBasis(const YGFloatOptional computedFlexBasis) {
  layout_.computedFlexBasis = computedFlexBasis;
}

void Node::setLayoutPosition(float position, int index) {
  layout_.position[index] = position;
}

void Node::setLayoutComputedFlexBasisGeneration(
    uint32_t computedFlexBasisGeneration) {
  layout_.computedFlexBasisGeneration = computedFlexBasisGeneration;
}

void Node::setLayoutMeasuredDimension(float measuredDimension, int index) {
  layout_.measuredDimensions[index] = measuredDimension;
}

void Node::setLayoutHadOverflow(bool hadOverflow) {
  layout_.setHadOverflow(hadOverflow);
}

void Node::setLayoutDimension(float dimension, int index) {
  layout_.dimensions[index] = dimension;
}

// If both left and right are defined, then use left. Otherwise return +left or
// -right depending on which is defined.
YGFloatOptional Node::relativePosition(
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

void Node::setPosition(
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

YGValue Node::marginLeadingValue(const YGFlexDirection axis) const {
  if (YGFlexDirectionIsRow(axis) &&
      !style_.margin()[YGEdgeStart].isUndefined()) {
    return style_.margin()[YGEdgeStart];
  } else {
    return style_.margin()[leading[axis]];
  }
}

YGValue Node::marginTrailingValue(const YGFlexDirection axis) const {
  if (YGFlexDirectionIsRow(axis) && !style_.margin()[YGEdgeEnd].isUndefined()) {
    return style_.margin()[YGEdgeEnd];
  } else {
    return style_.margin()[trailing[axis]];
  }
}

YGValue Node::resolveFlexBasisPtr() const {
  YGValue flexBasis = style_.flexBasis();
  if (flexBasis.unit != YGUnitAuto && flexBasis.unit != YGUnitUndefined) {
    return flexBasis;
  }
  if (!style_.flex().isUndefined() && style_.flex().unwrap() > 0.0f) {
    return config_->useWebDefaults() ? YGValueAuto : YGValueZero;
  }
  return YGValueAuto;
}

void Node::resolveDimension() {
  using namespace yoga;
  const Style& style = getStyle();
  for (auto dim : {YGDimensionWidth, YGDimensionHeight}) {
    if (!style.maxDimensions()[dim].isUndefined() &&
        YGValueEqual(style.maxDimensions()[dim], style.minDimensions()[dim])) {
      resolvedDimensions_[dim] = style.maxDimensions()[dim];
    } else {
      resolvedDimensions_[dim] = style.dimensions()[dim];
    }
  }
}

YGDirection Node::resolveDirection(const YGDirection ownerDirection) {
  if (style_.direction() == YGDirectionInherit) {
    return ownerDirection > YGDirectionInherit ? ownerDirection
                                               : YGDirectionLTR;
  } else {
    return style_.direction();
  }
}

YOGA_EXPORT void Node::clearChildren() {
  children_.clear();
  children_.shrink_to_fit();
}

// Other Methods

void Node::cloneChildrenIfNeeded(void* cloneContext) {
  iterChildrenAfterCloningIfNeeded([](Node*, void*) {}, cloneContext);
}

void Node::markDirtyAndPropagate() {
  if (!flags_.isDirty) {
    setDirty(true);
    setLayoutComputedFlexBasis(YGFloatOptional());
    if (owner_) {
      owner_->markDirtyAndPropagate();
    }
  }
}

void Node::markDirtyAndPropagateDownwards() {
  flags_.isDirty = true;
  for_each(children_.begin(), children_.end(), [](Node* childNode) {
    childNode->markDirtyAndPropagateDownwards();
  });
}

float Node::resolveFlexGrow() const {
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

float Node::resolveFlexShrink() const {
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

bool Node::isNodeFlexible() {
  return (
      (style_.positionType() != YGPositionTypeAbsolute) &&
      (resolveFlexGrow() != 0 || resolveFlexShrink() != 0));
}

float Node::getLeadingBorder(const YGFlexDirection axis) const {
  YGValue leadingBorder = YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.border(), YGEdgeStart, leading[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.border(), leading[axis], CompactValue::ofZero());
  return fmaxf(leadingBorder.value, 0.0f);
}

float Node::getTrailingBorder(const YGFlexDirection axis) const {
  YGValue trailingBorder = YGFlexDirectionIsRow(axis)
      ? computeEdgeValueForRow(
            style_.border(), YGEdgeEnd, trailing[axis], CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.border(), trailing[axis], CompactValue::ofZero());
  return fmaxf(trailingBorder.value, 0.0f);
}

YGFloatOptional Node::getLeadingPadding(
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

YGFloatOptional Node::getTrailingPadding(
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

YGFloatOptional Node::getLeadingPaddingAndBorder(
    const YGFlexDirection axis,
    const float widthSize) const {
  return getLeadingPadding(axis, widthSize) +
      YGFloatOptional(getLeadingBorder(axis));
}

YGFloatOptional Node::getTrailingPaddingAndBorder(
    const YGFlexDirection axis,
    const float widthSize) const {
  return getTrailingPadding(axis, widthSize) +
      YGFloatOptional(getTrailingBorder(axis));
}

void Node::reset() {
  YGAssertWithNode(
      this,
      children_.size() == 0,
      "Cannot reset a node which still has children attached");
  YGAssertWithNode(
      this, owner_ == nullptr, "Cannot reset a node still attached to a owner");

  *this = Node{getConfig()};
}

} // namespace facebook::yoga
