/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <algorithm>
#include <cstddef>
#include <iostream>

#include <yoga/algorithm/FlexDirection.h>
#include <yoga/algorithm/ResolveValue.h>
#include <yoga/debug/AssertFatal.h>
#include <yoga/node/Node.h>
#include <yoga/numeric/Comparison.h>

namespace facebook::yoga {

Node::Node() : Node{&Config::getDefault()} {}

Node::Node(const yoga::Config* config) : config_{config} {
  yoga::assertFatal(
      config != nullptr, "Attempting to construct Node with null config");

  if (config->useWebDefaults()) {
    useWebDefaults();
  }
}

Node::Node(Node&& node) {
  hasNewLayout_ = node.hasNewLayout_;
  isReferenceBaseline_ = node.isReferenceBaseline_;
  isDirty_ = node.isDirty_;
  nodeType_ = node.nodeType_;
  context_ = node.context_;
  measureFunc_ = node.measureFunc_;
  baselineFunc_ = node.baselineFunc_;
  printFunc_ = node.printFunc_;
  dirtiedFunc_ = node.dirtiedFunc_;
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

void Node::print() {
  if (printFunc_ != nullptr) {
    printFunc_(this);
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

FloatOptional Node::getLeadingPosition(
    const FlexDirection axis,
    const float axisSize) const {
  auto leadingPosition = isRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            YGEdgeStart,
            leadingEdge(axis),
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.position(), leadingEdge(axis), CompactValue::ofZero());
  return yoga::resolveValue(leadingPosition, axisSize);
}

FloatOptional Node::getTrailingPosition(
    const FlexDirection axis,
    const float axisSize) const {
  auto trailingPosition = isRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            YGEdgeEnd,
            trailingEdge(axis),
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.position(), trailingEdge(axis), CompactValue::ofZero());
  return yoga::resolveValue(trailingPosition, axisSize);
}

bool Node::isLeadingPositionDefined(const FlexDirection axis) const {
  auto leadingPosition = isRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            YGEdgeStart,
            leadingEdge(axis),
            CompactValue::ofUndefined())
      : computeEdgeValueForColumn(
            style_.position(), leadingEdge(axis), CompactValue::ofUndefined());
  return !leadingPosition.isUndefined();
}

bool Node::isTrailingPosDefined(const FlexDirection axis) const {
  auto trailingPosition = isRow(axis)
      ? computeEdgeValueForRow(
            style_.position(),
            YGEdgeEnd,
            trailingEdge(axis),
            CompactValue::ofUndefined())
      : computeEdgeValueForColumn(
            style_.position(), trailingEdge(axis), CompactValue::ofUndefined());
  return !trailingPosition.isUndefined();
}

FloatOptional Node::getLeadingMargin(
    const FlexDirection axis,
    const float widthSize) const {
  auto leadingMargin = isRow(axis)
      ? computeEdgeValueForRow(
            style_.margin(),
            YGEdgeStart,
            leadingEdge(axis),
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.margin(), leadingEdge(axis), CompactValue::ofZero());
  return leadingMargin.isAuto() ? FloatOptional{0}
                                : yoga::resolveValue(leadingMargin, widthSize);
}

FloatOptional Node::getTrailingMargin(
    const FlexDirection axis,
    const float widthSize) const {
  auto trailingMargin = isRow(axis)
      ? computeEdgeValueForRow(
            style_.margin(),
            YGEdgeEnd,
            trailingEdge(axis),
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.margin(), trailingEdge(axis), CompactValue::ofZero());
  return trailingMargin.isAuto()
      ? FloatOptional{0}
      : yoga::resolveValue(trailingMargin, widthSize);
}

FloatOptional Node::getMarginForAxis(
    const FlexDirection axis,
    const float widthSize) const {
  return getLeadingMargin(axis, widthSize) + getTrailingMargin(axis, widthSize);
}

FloatOptional Node::getGapForAxis(
    const FlexDirection axis,
    const float widthSize) const {
  auto gap = isRow(axis)
      ? computeColumnGap(style_.gap(), CompactValue::ofZero())
      : computeRowGap(style_.gap(), CompactValue::ofZero());
  return yoga::resolveValue(gap, widthSize);
}

YGSize Node::measure(
    float width,
    MeasureMode widthMode,
    float height,
    MeasureMode heightMode) {
  return measureFunc_(
      this, width, unscopedEnum(widthMode), height, unscopedEnum(heightMode));
}

float Node::baseline(float width, float height) const {
  return baselineFunc_(this, width, height);
}

// Setters

void Node::setMeasureFunc(YGMeasureFunc measureFunc) {
  if (measureFunc == nullptr) {
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(NodeType::Default);
  } else {
    yoga::assertFatalWithNode(
        this,
        children_.size() == 0,
        "Cannot set measure function: Nodes with measure functions cannot have "
        "children.");
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(NodeType::Text);
  }

  measureFunc_ = measureFunc;
}

void Node::replaceChild(Node* child, size_t index) {
  children_[index] = child;
}

void Node::replaceChild(Node* oldChild, Node* newChild) {
  std::replace(children_.begin(), children_.end(), oldChild, newChild);
}

void Node::insertChild(Node* child, size_t index) {
  children_.insert(children_.begin() + static_cast<ptrdiff_t>(index), child);
}

void Node::setConfig(yoga::Config* config) {
  yoga::assertFatal(
      config != nullptr, "Attempting to set a null config on a Node");
  yoga::assertFatalWithConfig(
      config,
      config->useWebDefaults() == config_->useWebDefaults(),
      "UseWebDefaults may not be changed after constructing a Node");

  if (yoga::configUpdateInvalidatesLayout(*config_, *config)) {
    markDirtyAndPropagate();
  }

  config_ = config;
}

void Node::setDirty(bool isDirty) {
  if (isDirty == isDirty_) {
    return;
  }
  isDirty_ = isDirty;
  if (isDirty && dirtiedFunc_) {
    dirtiedFunc_(this);
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

void Node::removeChild(size_t index) {
  children_.erase(children_.begin() + static_cast<ptrdiff_t>(index));
}

void Node::setLayoutDirection(Direction direction) {
  layout_.setDirection(direction);
}

void Node::setLayoutMargin(float margin, YGEdge edge) {
  assertFatal(
      edge < layout_.margin.size(), "Edge must be top/left/bottom/right");
  layout_.margin[edge] = margin;
}

void Node::setLayoutBorder(float border, YGEdge edge) {
  assertFatal(
      edge < layout_.border.size(), "Edge must be top/left/bottom/right");
  layout_.border[edge] = border;
}

void Node::setLayoutPadding(float padding, YGEdge edge) {
  assertFatal(
      edge < layout_.padding.size(), "Edge must be top/left/bottom/right");
  layout_.padding[edge] = padding;
}

void Node::setLayoutLastOwnerDirection(Direction direction) {
  layout_.lastOwnerDirection = direction;
}

void Node::setLayoutComputedFlexBasis(const FloatOptional computedFlexBasis) {
  layout_.computedFlexBasis = computedFlexBasis;
}

void Node::setLayoutPosition(float position, YGEdge edge) {
  assertFatal(
      edge < layout_.position.size(), "Edge must be top/left/bottom/right");
  layout_.position[edge] = position;
}

void Node::setLayoutComputedFlexBasisGeneration(
    uint32_t computedFlexBasisGeneration) {
  layout_.computedFlexBasisGeneration = computedFlexBasisGeneration;
}

void Node::setLayoutMeasuredDimension(
    float measuredDimension,
    YGDimension dimension) {
  layout_.setMeasuredDimension(dimension, measuredDimension);
}

void Node::setLayoutHadOverflow(bool hadOverflow) {
  layout_.setHadOverflow(hadOverflow);
}

void Node::setLayoutDimension(float dimensionValue, YGDimension dimension) {
  layout_.setDimension(dimension, dimensionValue);
}

// If both left and right are defined, then use left. Otherwise return +left or
// -right depending on which is defined.
FloatOptional Node::relativePosition(
    const FlexDirection axis,
    const float axisSize) const {
  if (isLeadingPositionDefined(axis)) {
    return getLeadingPosition(axis, axisSize);
  }

  FloatOptional trailingPosition = getTrailingPosition(axis, axisSize);
  if (!trailingPosition.isUndefined()) {
    trailingPosition = FloatOptional{-1 * trailingPosition.unwrap()};
  }
  return trailingPosition;
}

void Node::setPosition(
    const Direction direction,
    const float mainSize,
    const float crossSize,
    const float ownerWidth) {
  /* Root nodes should be always layouted as LTR, so we don't return negative
   * values. */
  const Direction directionRespectingRoot =
      owner_ != nullptr ? direction : Direction::LTR;
  const FlexDirection mainAxis =
      yoga::resolveDirection(style_.flexDirection(), directionRespectingRoot);
  const FlexDirection crossAxis =
      yoga::resolveCrossDirection(mainAxis, directionRespectingRoot);

  // Here we should check for `PositionType::Static` and in this case zero inset
  // properties (left, right, top, bottom, begin, end).
  // https://www.w3.org/TR/css-position-3/#valdef-position-static
  const FloatOptional relativePositionMain =
      relativePosition(mainAxis, mainSize);
  const FloatOptional relativePositionCross =
      relativePosition(crossAxis, crossSize);

  setLayoutPosition(
      (getLeadingMargin(mainAxis, ownerWidth) + relativePositionMain).unwrap(),
      leadingEdge(mainAxis));
  setLayoutPosition(
      (getTrailingMargin(mainAxis, ownerWidth) + relativePositionMain).unwrap(),
      trailingEdge(mainAxis));
  setLayoutPosition(
      (getLeadingMargin(crossAxis, ownerWidth) + relativePositionCross)
          .unwrap(),
      leadingEdge(crossAxis));
  setLayoutPosition(
      (getTrailingMargin(crossAxis, ownerWidth) + relativePositionCross)
          .unwrap(),
      trailingEdge(crossAxis));
}

YGValue Node::marginLeadingValue(const FlexDirection axis) const {
  if (isRow(axis) && !style_.margin()[YGEdgeStart].isUndefined()) {
    return style_.margin()[YGEdgeStart];
  } else {
    return style_.margin()[leadingEdge(axis)];
  }
}

YGValue Node::marginTrailingValue(const FlexDirection axis) const {
  if (isRow(axis) && !style_.margin()[YGEdgeEnd].isUndefined()) {
    return style_.margin()[YGEdgeEnd];
  } else {
    return style_.margin()[trailingEdge(axis)];
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
    if (!style.maxDimension(dim).isUndefined() &&
        yoga::inexactEquals(style.maxDimension(dim), style.minDimension(dim))) {
      resolvedDimensions_[dim] = style.maxDimension(dim);
    } else {
      resolvedDimensions_[dim] = style.dimension(dim);
    }
  }
}

Direction Node::resolveDirection(const Direction ownerDirection) {
  if (style_.direction() == Direction::Inherit) {
    return ownerDirection != Direction::Inherit ? ownerDirection
                                                : Direction::LTR;
  } else {
    return style_.direction();
  }
}

void Node::clearChildren() {
  children_.clear();
  children_.shrink_to_fit();
}

// Other Methods

void Node::cloneChildrenIfNeeded() {
  size_t i = 0;
  for (Node*& child : children_) {
    if (child->getOwner() != this) {
      child = resolveRef(config_->cloneNode(child, this, i));
      child->setOwner(this);
    }
    i += 1;
  }
}

void Node::markDirtyAndPropagate() {
  if (!isDirty_) {
    setDirty(true);
    setLayoutComputedFlexBasis(FloatOptional());
    if (owner_) {
      owner_->markDirtyAndPropagate();
    }
  }
}

void Node::markDirtyAndPropagateDownwards() {
  isDirty_ = true;
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
  return Style::DefaultFlexGrow;
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
  return config_->useWebDefaults() ? Style::WebDefaultFlexShrink
                                   : Style::DefaultFlexShrink;
}

bool Node::isNodeFlexible() {
  return (
      (style_.positionType() != PositionType::Absolute) &&
      (resolveFlexGrow() != 0 || resolveFlexShrink() != 0));
}

float Node::getLeadingBorder(const FlexDirection axis) const {
  YGValue leadingBorder = isRow(axis)
      ? computeEdgeValueForRow(
            style_.border(),
            YGEdgeStart,
            leadingEdge(axis),
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.border(), leadingEdge(axis), CompactValue::ofZero());
  return fmaxf(leadingBorder.value, 0.0f);
}

float Node::getTrailingBorder(const FlexDirection axis) const {
  YGValue trailingBorder = isRow(axis)
      ? computeEdgeValueForRow(
            style_.border(),
            YGEdgeEnd,
            trailingEdge(axis),
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.border(), trailingEdge(axis), CompactValue::ofZero());
  return fmaxf(trailingBorder.value, 0.0f);
}

FloatOptional Node::getLeadingPadding(
    const FlexDirection axis,
    const float widthSize) const {
  auto leadingPadding = isRow(axis)
      ? computeEdgeValueForRow(
            style_.padding(),
            YGEdgeStart,
            leadingEdge(axis),
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.padding(), leadingEdge(axis), CompactValue::ofZero());
  return yoga::maxOrDefined(
      yoga::resolveValue(leadingPadding, widthSize), FloatOptional(0.0f));
}

FloatOptional Node::getTrailingPadding(
    const FlexDirection axis,
    const float widthSize) const {
  auto trailingPadding = isRow(axis)
      ? computeEdgeValueForRow(
            style_.padding(),
            YGEdgeEnd,
            trailingEdge(axis),
            CompactValue::ofZero())
      : computeEdgeValueForColumn(
            style_.padding(), trailingEdge(axis), CompactValue::ofZero());
  return yoga::maxOrDefined(
      yoga::resolveValue(trailingPadding, widthSize), FloatOptional(0.0f));
}

FloatOptional Node::getLeadingPaddingAndBorder(
    const FlexDirection axis,
    const float widthSize) const {
  return getLeadingPadding(axis, widthSize) +
      FloatOptional(getLeadingBorder(axis));
}

FloatOptional Node::getTrailingPaddingAndBorder(
    const FlexDirection axis,
    const float widthSize) const {
  return getTrailingPadding(axis, widthSize) +
      FloatOptional(getTrailingBorder(axis));
}

void Node::reset() {
  yoga::assertFatalWithNode(
      this,
      children_.size() == 0,
      "Cannot reset a node which still has children attached");
  yoga::assertFatalWithNode(
      this, owner_ == nullptr, "Cannot reset a node still attached to a owner");

  *this = Node{getConfig()};
}

} // namespace facebook::yoga
