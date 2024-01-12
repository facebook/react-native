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

// TODO: Edge value resolution should be moved to `yoga::Style`
template <auto Field>
Style::Length Node::computeEdgeValueForRow(Edge rowEdge, Edge edge) const {
  if ((style_.*Field)(rowEdge).isDefined()) {
    return (style_.*Field)(rowEdge);
  } else if ((style_.*Field)(edge).isDefined()) {
    return (style_.*Field)(edge);
  } else if ((style_.*Field)(Edge::Horizontal).isDefined()) {
    return (style_.*Field)(Edge::Horizontal);
  } else {
    return (style_.*Field)(Edge::All);
  }
}

// TODO: Edge value resolution should be moved to `yoga::Style`
template <auto Field>
Style::Length Node::computeEdgeValueForColumn(Edge edge) const {
  if ((style_.*Field)(edge).isDefined()) {
    return (style_.*Field)(edge);
  } else if ((style_.*Field)(Edge::Vertical).isDefined()) {
    return (style_.*Field)(Edge::Vertical);
  } else {
    return (style_.*Field)(Edge::All);
  }
}

Edge Node::getInlineStartEdge(FlexDirection flexDirection, Direction direction)
    const {
  return inlineStartEdge(flexDirection, direction);
}

Edge Node::getInlineEndEdge(FlexDirection flexDirection, Direction direction)
    const {
  return inlineEndEdge(flexDirection, direction);
}

Edge Node::getFlexStartRelativeEdge(
    FlexDirection flexDirection,
    Direction direction) const {
  return flexStartRelativeEdge(flexDirection, direction);
}

Edge Node::getFlexEndRelativeEdge(
    FlexDirection flexDirection,
    Direction direction) const {
  return flexEndRelativeEdge(flexDirection, direction);
}

bool Node::isFlexStartPositionDefined(FlexDirection axis, Direction direction)
    const {
  auto leadingPosition = isRow(axis)
      ? computeEdgeValueForRow<&Style::position>(
            getFlexStartRelativeEdge(axis, direction), flexStartEdge(axis))
      : computeEdgeValueForColumn<&Style::position>(flexStartEdge(axis));

  return leadingPosition.isDefined();
}

bool Node::isInlineStartPositionDefined(FlexDirection axis, Direction direction)
    const {
  Edge startEdge = getInlineStartEdge(axis, direction);
  Style::Length leadingPosition = isRow(axis)
      ? computeEdgeValueForRow<&Style::position>(Edge::Start, startEdge)
      : computeEdgeValueForColumn<&Style::position>(startEdge);

  return leadingPosition.isDefined();
}

bool Node::isFlexEndPositionDefined(FlexDirection axis, Direction direction)
    const {
  auto trailingPosition = isRow(axis)
      ? computeEdgeValueForRow<&Style::position>(
            getFlexEndRelativeEdge(axis, direction), flexEndEdge(axis))
      : computeEdgeValueForColumn<&Style::position>(flexEndEdge(axis));

  return !trailingPosition.isUndefined();
}

bool Node::isInlineEndPositionDefined(FlexDirection axis, Direction direction)
    const {
  Edge endEdge = getInlineEndEdge(axis, direction);
  Style::Length trailingPosition = isRow(axis)
      ? computeEdgeValueForRow<&Style::position>(Edge::End, endEdge)
      : computeEdgeValueForColumn<&Style::position>(endEdge);

  return trailingPosition.isDefined();
}

float Node::getFlexStartPosition(
    FlexDirection axis,
    Direction direction,
    float axisSize) const {
  auto leadingPosition = isRow(axis)
      ? computeEdgeValueForRow<&Style::position>(
            getFlexStartRelativeEdge(axis, direction), flexStartEdge(axis))
      : computeEdgeValueForColumn<&Style::position>(flexStartEdge(axis));

  return leadingPosition.resolve(axisSize).unwrapOrDefault(0.0f);
}

float Node::getInlineStartPosition(
    FlexDirection axis,
    Direction direction,
    float axisSize) const {
  Edge startEdge = getInlineStartEdge(axis, direction);
  Style::Length leadingPosition = isRow(axis)
      ? computeEdgeValueForRow<&Style::position>(Edge::Start, startEdge)
      : computeEdgeValueForColumn<&Style::position>(startEdge);

  return leadingPosition.resolve(axisSize).unwrapOrDefault(0.0f);
}

float Node::getFlexEndPosition(
    FlexDirection axis,
    Direction direction,
    float axisSize) const {
  auto trailingPosition = isRow(axis)
      ? computeEdgeValueForRow<&Style::position>(
            getFlexEndRelativeEdge(axis, direction), flexEndEdge(axis))
      : computeEdgeValueForColumn<&Style::position>(flexEndEdge(axis));

  return trailingPosition.resolve(axisSize).unwrapOrDefault(0.0f);
}

float Node::getInlineEndPosition(
    FlexDirection axis,
    Direction direction,
    float axisSize) const {
  Edge endEdge = getInlineEndEdge(axis, direction);
  Style::Length trailingPosition = isRow(axis)
      ? computeEdgeValueForRow<&Style::position>(Edge::End, endEdge)
      : computeEdgeValueForColumn<&Style::position>(endEdge);

  return trailingPosition.resolve(axisSize).unwrapOrDefault(0.0f);
}

float Node::getFlexStartMargin(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  auto leadingMargin = isRow(axis)
      ? computeEdgeValueForRow<&Style::margin>(
            getFlexStartRelativeEdge(axis, direction), flexStartEdge(axis))
      : computeEdgeValueForColumn<&Style::margin>(flexStartEdge(axis));

  return leadingMargin.resolve(widthSize).unwrapOrDefault(0.0f);
}

float Node::getInlineStartMargin(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  Edge startEdge = getInlineStartEdge(axis, direction);
  Style::Length leadingMargin = isRow(axis)
      ? computeEdgeValueForRow<&Style::margin>(Edge::Start, startEdge)
      : computeEdgeValueForColumn<&Style::margin>(startEdge);

  return leadingMargin.resolve(widthSize).unwrapOrDefault(0.0f);
}

float Node::getFlexEndMargin(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  auto trailingMargin = isRow(axis)
      ? computeEdgeValueForRow<&Style::margin>(
            getFlexEndRelativeEdge(axis, direction), flexEndEdge(axis))
      : computeEdgeValueForColumn<&Style::margin>(flexEndEdge(axis));

  return trailingMargin.resolve(widthSize).unwrapOrDefault(0.0f);
}

float Node::getInlineEndMargin(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  Edge endEdge = getInlineEndEdge(axis, direction);
  Style::Length trailingMargin = isRow(axis)
      ? computeEdgeValueForRow<&Style::margin>(Edge::End, endEdge)
      : computeEdgeValueForColumn<&Style::margin>(endEdge);

  return trailingMargin.resolve(widthSize).unwrapOrDefault(0.0f);
}

float Node::getInlineStartBorder(FlexDirection axis, Direction direction)
    const {
  Edge startEdge = getInlineStartEdge(axis, direction);
  Style::Length leadingBorder = isRow(axis)
      ? computeEdgeValueForRow<&Style::border>(Edge::Start, startEdge)
      : computeEdgeValueForColumn<&Style::border>(startEdge);

  return maxOrDefined(leadingBorder.value().unwrap(), 0.0f);
}

float Node::getFlexStartBorder(FlexDirection axis, Direction direction) const {
  Style::Length leadingBorder = isRow(axis)
      ? computeEdgeValueForRow<&Style::border>(
            getFlexStartRelativeEdge(axis, direction), flexStartEdge(axis))
      : computeEdgeValueForColumn<&Style::border>(flexStartEdge(axis));

  return maxOrDefined(leadingBorder.value().unwrap(), 0.0f);
}

float Node::getInlineEndBorder(FlexDirection axis, Direction direction) const {
  Edge endEdge = getInlineEndEdge(axis, direction);
  Style::Length trailingBorder = isRow(axis)
      ? computeEdgeValueForRow<&Style::border>(Edge::End, endEdge)
      : computeEdgeValueForColumn<&Style::border>(endEdge);

  return maxOrDefined(trailingBorder.value().unwrap(), 0.0f);
}

float Node::getFlexEndBorder(FlexDirection axis, Direction direction) const {
  Style::Length trailingBorder = isRow(axis)
      ? computeEdgeValueForRow<&Style::border>(
            getFlexEndRelativeEdge(axis, direction), flexEndEdge(axis))
      : computeEdgeValueForColumn<&Style::border>(flexEndEdge(axis));

  return maxOrDefined(trailingBorder.value().unwrap(), 0.0f);
}

float Node::getInlineStartPadding(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  Edge startEdge = getInlineStartEdge(axis, direction);
  Style::Length leadingPadding = isRow(axis)
      ? computeEdgeValueForRow<&Style::padding>(Edge::Start, startEdge)
      : computeEdgeValueForColumn<&Style::padding>(startEdge);

  return maxOrDefined(leadingPadding.resolve(widthSize).unwrap(), 0.0f);
}

float Node::getFlexStartPadding(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  auto leadingPadding = isRow(axis)
      ? computeEdgeValueForRow<&Style::padding>(
            getFlexStartRelativeEdge(axis, direction), flexStartEdge(axis))
      : computeEdgeValueForColumn<&Style::padding>(flexStartEdge(axis));

  return maxOrDefined(leadingPadding.resolve(widthSize).unwrap(), 0.0f);
}

float Node::getInlineEndPadding(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  Edge endEdge = getInlineEndEdge(axis, direction);
  Style::Length trailingPadding = isRow(axis)
      ? computeEdgeValueForRow<&Style::padding>(Edge::End, endEdge)
      : computeEdgeValueForColumn<&Style::padding>(endEdge);

  return maxOrDefined(trailingPadding.resolve(widthSize).unwrap(), 0.0f);
}

float Node::getFlexEndPadding(
    FlexDirection axis,
    Direction direction,
    float widthSize) const {
  auto trailingPadding = isRow(axis)
      ? computeEdgeValueForRow<&Style::padding>(
            getFlexEndRelativeEdge(axis, direction), flexEndEdge(axis))
      : computeEdgeValueForColumn<&Style::padding>(flexEndEdge(axis));

  return maxOrDefined(trailingPadding.resolve(widthSize).unwrap(), 0.0f);
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

float Node::getBorderForAxis(FlexDirection axis) const {
  return getInlineStartBorder(axis, Direction::LTR) +
      getInlineEndBorder(axis, Direction::LTR);
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
  return maxOrDefined(gap.resolve(0.0f /*ownerSize*/).unwrap(), 0.0f);
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

float Node::dimensionWithMargin(
    const FlexDirection axis,
    const float widthSize) {
  return getLayout().measuredDimension(dimension(axis)) +
      getMarginForAxis(axis, widthSize);
}

bool Node::isLayoutDimensionDefined(const FlexDirection axis) {
  const float value = getLayout().measuredDimension(dimension(axis));
  return yoga::isDefined(value) && value >= 0.0f;
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

void Node::setLayoutMargin(float margin, Edge edge) {
  layout_.setMargin(edge, margin);
}

void Node::setLayoutBorder(float border, Edge edge) {
  layout_.setBorder(edge, border);
}

void Node::setLayoutPadding(float padding, Edge edge) {
  layout_.setPadding(edge, padding);
}

void Node::setLayoutLastOwnerDirection(Direction direction) {
  layout_.lastOwnerDirection = direction;
}

void Node::setLayoutComputedFlexBasis(const FloatOptional computedFlexBasis) {
  layout_.computedFlexBasis = computedFlexBasis;
}

void Node::setLayoutPosition(float position, Edge edge) {
  layout_.setPosition(edge, position);
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

void Node::setLayoutDimension(float LengthValue, Dimension dimension) {
  layout_.setDimension(dimension, LengthValue);
}

// If both left and right are defined, then use left. Otherwise return +left or
// -right depending on which is defined. Ignore statically positioned nodes as
// insets do not apply to them.
float Node::relativePosition(
    FlexDirection axis,
    Direction direction,
    float axisSize) const {
  if (style_.positionType() == PositionType::Static &&
      !hasErrata(Errata::PositionStaticBehavesLikeRelative)) {
    return 0;
  }
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

  // In the case of position static these are just 0. See:
  // https://www.w3.org/TR/css-position-3/#valdef-position-static
  const float relativePositionMain =
      relativePosition(mainAxis, directionRespectingRoot, mainSize);
  const float relativePositionCross =
      relativePosition(crossAxis, directionRespectingRoot, crossSize);

  const Edge mainAxisLeadingEdge = getInlineStartEdge(mainAxis, direction);
  const Edge mainAxisTrailingEdge = getInlineEndEdge(mainAxis, direction);
  const Edge crossAxisLeadingEdge = getInlineStartEdge(crossAxis, direction);
  const Edge crossAxisTrailingEdge = getInlineEndEdge(crossAxis, direction);

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

Style::Length Node::getFlexStartMarginValue(FlexDirection axis) const {
  if (isRow(axis) && style_.margin(Edge::Start).isDefined()) {
    return style_.margin(Edge::Start);
  } else {
    return style_.margin(flexStartEdge(axis));
  }
}

Style::Length Node::marginTrailingValue(FlexDirection axis) const {
  if (isRow(axis) && style_.margin(Edge::End).isDefined()) {
    return style_.margin(Edge::End);
  } else {
    return style_.margin(flexEndEdge(axis));
  }
}

Style::Length Node::resolveFlexBasisPtr() const {
  Style::Length flexBasis = style_.flexBasis();
  if (flexBasis.unit() != Unit::Auto && flexBasis.unit() != Unit::Undefined) {
    return flexBasis;
  }
  if (style_.flex().isDefined() && style_.flex().unwrap() > 0.0f) {
    return config_->useWebDefaults() ? value::ofAuto() : value::points(0);
  }
  return value::ofAuto();
}

void Node::resolveDimension() {
  const Style& style = getStyle();
  for (auto dim : {Dimension::Width, Dimension::Height}) {
    if (style.maxDimension(dim).isDefined() &&
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

float Node::resolveFlexGrow() const {
  // Root nodes flexGrow should always be 0
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (style_.flexGrow().isDefined()) {
    return style_.flexGrow().unwrap();
  }
  if (style_.flex().isDefined() && style_.flex().unwrap() > 0.0f) {
    return style_.flex().unwrap();
  }
  return Style::DefaultFlexGrow;
}

float Node::resolveFlexShrink() const {
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (style_.flexShrink().isDefined()) {
    return style_.flexShrink().unwrap();
  }
  if (!config_->useWebDefaults() && style_.flex().isDefined() &&
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
