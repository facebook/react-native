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
    YGEdge edge) {
  if (!edges[rowEdge].isUndefined()) {
    return edges[rowEdge];
  } else if (!edges[edge].isUndefined()) {
    return edges[edge];
  } else if (!edges[YGEdgeHorizontal].isUndefined()) {
    return edges[YGEdgeHorizontal];
  } else {
    return edges[YGEdgeAll];
  }
}

CompactValue Node::computeEdgeValueForColumn(
    const Style::Edges& edges,
    YGEdge edge) {
  if (!edges[edge].isUndefined()) {
    return edges[edge];
  } else if (!edges[YGEdgeVertical].isUndefined()) {
    return edges[YGEdgeVertical];
  } else {
    return edges[YGEdgeAll];
  }
}

YGEdge Node::getInlineStartEdgeUsingErrata(
    FlexDirection flexDirection,
    Direction direction) const {
  return hasErrata(Errata::StartingEndingEdgeFromFlexDirection)
      ? flexStartEdge(flexDirection)
      : inlineStartEdge(flexDirection, direction);
}

YGEdge Node::getInlineEndEdgeUsingErrata(
    FlexDirection flexDirection,
    Direction direction) const {
  return hasErrata(Errata::StartingEndingEdgeFromFlexDirection)
      ? flexEndEdge(flexDirection)
      : inlineEndEdge(flexDirection, direction);
}

bool Node::isInlineStartPositionDefined(FlexDirection axis, Direction direction)
    const {
  const YGEdge startEdge = getInlineStartEdgeUsingErrata(axis, direction);
  auto leadingPosition = isRow(axis)
      ? computeEdgeValueForRow(style_.position(), YGEdgeStart, startEdge)
      : computeEdgeValueForColumn(style_.position(), startEdge);

  return !leadingPosition.isUndefined();
}

bool Node::isInlineEndPositionDefined(FlexDirection axis, Direction direction)
    const {
  const YGEdge endEdge = getInlineEndEdgeUsingErrata(axis, direction);
  auto trailingPosition = isRow(axis)
      ? computeEdgeValueForRow(style_.position(), YGEdgeEnd, endEdge)
      : computeEdgeValueForColumn(style_.position(), endEdge);

  return !trailingPosition.isUndefined();
}

float Node::getInlineStartPosition(
    FlexDirection axis,
    Direction direction,
    float axisSize) const {
  const YGEdge startEdge = getInlineStartEdgeUsingErrata(axis, direction);
  auto leadingPosition = isRow(axis)
      ? computeEdgeValueForRow(style_.position(), YGEdgeStart, startEdge)
      : computeEdgeValueForColumn(style_.position(), startEdge);

  return resolveValue(leadingPosition, axisSize).unwrapOrDefault(0.0f);
}

float Node::getInlineEndPosition(
    FlexDirection axis,
    Direction direction,
    float axisSize) const {
  const YGEdge endEdge = getInlineEndEdgeUsingErrata(axis, direction);
  auto trailingPosition = isRow(axis)
      ? computeEdgeValueForRow(style_.position(), YGEdgeEnd, endEdge)
      : computeEdgeValueForColumn(style_.position(), endEdge);

  return resolveValue(trailingPosition, axisSize).unwrapOrDefault(0.0f);
}

float Node::getInlineStartMargin(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  const YGEdge startEdge = getInlineStartEdgeUsingErrata(axis, direction);
  auto leadingMargin = isRow(axis)
      ? computeEdgeValueForRow(style_.margin(), YGEdgeStart, startEdge)
      : computeEdgeValueForColumn(style_.margin(), startEdge);

  return resolveValue(leadingMargin, widthSize).unwrapOrDefault(0.0f);
}

float Node::getInlineEndMargin(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  const YGEdge endEdge = getInlineEndEdgeUsingErrata(axis, direction);
  auto trailingMargin = isRow(axis)
      ? computeEdgeValueForRow(style_.margin(), YGEdgeEnd, endEdge)
      : computeEdgeValueForColumn(style_.margin(), endEdge);

  return resolveValue(trailingMargin, widthSize).unwrapOrDefault(0.0f);
}

float Node::getInlineStartBorder(FlexDirection axis, Direction direction)
    const {
  const YGEdge startEdge = getInlineStartEdgeUsingErrata(axis, direction);
  YGValue leadingBorder = isRow(axis)
      ? computeEdgeValueForRow(style_.border(), YGEdgeStart, startEdge)
      : computeEdgeValueForColumn(style_.border(), startEdge);

  return maxOrDefined(leadingBorder.value, 0.0f);
}

float Node::getFlexStartBorder(FlexDirection axis, Direction direction) const {
  const YGEdge leadRelativeFlexItemEdge =
      flexStartRelativeEdge(axis, direction);
  YGValue leadingBorder = isRow(axis)
      ? computeEdgeValueForRow(
            style_.border(), leadRelativeFlexItemEdge, flexStartEdge(axis))
      : computeEdgeValueForColumn(style_.border(), flexStartEdge(axis));

  return maxOrDefined(leadingBorder.value, 0.0f);
}

float Node::getInlineEndBorder(FlexDirection axis, Direction direction) const {
  const YGEdge endEdge = getInlineEndEdgeUsingErrata(axis, direction);
  YGValue trailingBorder = isRow(axis)
      ? computeEdgeValueForRow(style_.border(), YGEdgeEnd, endEdge)
      : computeEdgeValueForColumn(style_.border(), endEdge);

  return maxOrDefined(trailingBorder.value, 0.0f);
}

float Node::getFlexEndBorder(FlexDirection axis, Direction direction) const {
  const YGEdge trailRelativeFlexItemEdge = flexEndRelativeEdge(axis, direction);
  YGValue trailingBorder = isRow(axis)
      ? computeEdgeValueForRow(
            style_.border(), trailRelativeFlexItemEdge, flexEndEdge(axis))
      : computeEdgeValueForColumn(style_.border(), flexEndEdge(axis));

  return maxOrDefined(trailingBorder.value, 0.0f);
}

float Node::getInlineStartPadding(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  const YGEdge startEdge = getInlineStartEdgeUsingErrata(axis, direction);
  auto leadingPadding = isRow(axis)
      ? computeEdgeValueForRow(style_.padding(), YGEdgeStart, startEdge)
      : computeEdgeValueForColumn(style_.padding(), startEdge);

  return maxOrDefined(resolveValue(leadingPadding, widthSize).unwrap(), 0.0f);
}

float Node::getFlexStartPadding(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  const YGEdge leadRelativeFlexItemEdge =
      flexStartRelativeEdge(axis, direction);
  auto leadingPadding = isRow(axis)
      ? computeEdgeValueForRow(
            style_.padding(), leadRelativeFlexItemEdge, flexStartEdge(axis))
      : computeEdgeValueForColumn(style_.padding(), flexStartEdge(axis));

  return maxOrDefined(resolveValue(leadingPadding, widthSize).unwrap(), 0.0f);
}

float Node::getInlineEndPadding(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  const YGEdge endEdge = getInlineEndEdgeUsingErrata(axis, direction);
  auto trailingPadding = isRow(axis)
      ? computeEdgeValueForRow(style_.padding(), YGEdgeEnd, endEdge)
      : computeEdgeValueForColumn(style_.padding(), endEdge);

  return maxOrDefined(resolveValue(trailingPadding, widthSize).unwrap(), 0.0f);
}

float Node::getFlexEndPadding(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  const YGEdge trailRelativeFlexItemEdge = flexEndRelativeEdge(axis, direction);
  auto trailingPadding = isRow(axis)
      ? computeEdgeValueForRow(
            style_.padding(), trailRelativeFlexItemEdge, flexEndEdge(axis))
      : computeEdgeValueForColumn(style_.padding(), flexEndEdge(axis));

  return maxOrDefined(resolveValue(trailingPadding, widthSize).unwrap(), 0.0f);
}

float Node::getInlineStartPaddingAndBorder(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  return getInlineStartPadding(axis, direction, widthSize) +
      getInlineStartBorder(axis, direction);
}

float Node::getFlexStartPaddingAndBorder(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  return getFlexStartPadding(axis, direction, widthSize) +
      getFlexStartBorder(axis, direction);
}

float Node::getInlineEndPaddingAndBorder(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  return getInlineEndPadding(axis, direction, widthSize) +
      getInlineEndBorder(axis, direction);
}

float Node::getFlexEndPaddingAndBorder(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  return getFlexEndPadding(axis, direction, widthSize) +
      getFlexEndBorder(axis, direction);
}

float Node::getMarginForAxis(FlexDirection axis, float widthSize) const {
  // The total margin for a given axis does not depend on the direction
  // so hardcoding LTR here to avoid piping direction to this function
  return getInlineStartMargin(axis, Direction::LTR, widthSize) +
      getInlineEndMargin(axis, Direction::LTR, widthSize);
}

float Node::getGapForAxis(FlexDirection axis) const {
  auto gap = isRow(axis) ? style_.resolveColumnGap() : style_.resolveRowGap();
  // TODO: Validate percentage gap, and expose ability to set percentage to
  // public API
  return maxOrDefined(resolveValue(gap, 0.0f /*ownerSize*/).unwrap(), 0.0f);
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
      edge < static_cast<int>(layout_.margin.size()),
      "Edge must be top/left/bottom/right");
  layout_.margin[edge] = margin;
}

void Node::setLayoutBorder(float border, YGEdge edge) {
  assertFatal(
      edge < static_cast<int>(layout_.border.size()),
      "Edge must be top/left/bottom/right");
  layout_.border[edge] = border;
}

void Node::setLayoutPadding(float padding, YGEdge edge) {
  assertFatal(
      edge < static_cast<int>(layout_.padding.size()),
      "Edge must be top/left/bottom/right");
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
      edge < static_cast<int>(layout_.position.size()),
      "Edge must be top/left/bottom/right");
  layout_.position[edge] = position;
}

void Node::setLayoutComputedFlexBasisGeneration(
    uint32_t computedFlexBasisGeneration) {
  layout_.computedFlexBasisGeneration = computedFlexBasisGeneration;
}

void Node::setLayoutMeasuredDimension(
    float measuredDimension,
    Dimension dimension) {
  layout_.setMeasuredDimension(dimension, measuredDimension);
}

void Node::setLayoutHadOverflow(bool hadOverflow) {
  layout_.setHadOverflow(hadOverflow);
}

void Node::setLayoutDimension(float dimensionValue, Dimension dimension) {
  layout_.setDimension(dimension, dimensionValue);
}

// If both left and right are defined, then use left. Otherwise return +left or
// -right depending on which is defined.
float Node::relativePosition(
    FlexDirection axis,
    Direction direction,
    float axisSize) const {
  if (isInlineStartPositionDefined(axis, direction)) {
    return getInlineStartPosition(axis, direction, axisSize);
  }

  return -1 * getInlineEndPosition(axis, direction, axisSize);
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
  const float relativePositionMain =
      relativePosition(mainAxis, directionRespectingRoot, mainSize);
  const float relativePositionCross =
      relativePosition(crossAxis, directionRespectingRoot, crossSize);

  const YGEdge mainAxisLeadingEdge =
      getInlineStartEdgeUsingErrata(mainAxis, direction);
  const YGEdge mainAxisTrailingEdge =
      getInlineEndEdgeUsingErrata(mainAxis, direction);
  const YGEdge crossAxisLeadingEdge =
      getInlineStartEdgeUsingErrata(crossAxis, direction);
  const YGEdge crossAxisTrailingEdge =
      getInlineEndEdgeUsingErrata(crossAxis, direction);

  setLayoutPosition(
      (getInlineStartMargin(mainAxis, direction, ownerWidth) +
       relativePositionMain),
      mainAxisLeadingEdge);
  setLayoutPosition(
      (getInlineEndMargin(mainAxis, direction, ownerWidth) +
       relativePositionMain),
      mainAxisTrailingEdge);
  setLayoutPosition(
      (getInlineStartMargin(crossAxis, direction, ownerWidth) +
       relativePositionCross),
      crossAxisLeadingEdge);
  setLayoutPosition(
      (getInlineEndMargin(crossAxis, direction, ownerWidth) +
       relativePositionCross),
      crossAxisTrailingEdge);
}

YGValue Node::getFlexStartMarginValue(FlexDirection axis) const {
  if (isRow(axis) && !style_.margin()[YGEdgeStart].isUndefined()) {
    return style_.margin()[YGEdgeStart];
  } else {
    return style_.margin()[flexStartEdge(axis)];
  }
}

YGValue Node::marginTrailingValue(FlexDirection axis) const {
  if (isRow(axis) && !style_.margin()[YGEdgeEnd].isUndefined()) {
    return style_.margin()[YGEdgeEnd];
  } else {
    return style_.margin()[flexEndEdge(axis)];
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
  const Style& style = getStyle();
  for (auto dim : {Dimension::Width, Dimension::Height}) {
    if (!style.maxDimension(dim).isUndefined() &&
        yoga::inexactEquals(style.maxDimension(dim), style.minDimension(dim))) {
      resolvedDimensions_[yoga::to_underlying(dim)] = style.maxDimension(dim);
    } else {
      resolvedDimensions_[yoga::to_underlying(dim)] = style.dimension(dim);
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
