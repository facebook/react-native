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

Node::Node(yoga::Config* config) : config_{config} {
  yoga::assertFatal(
      config != nullptr, "Attempting to construct Node with null config");

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

FloatOptional Node::getLeadingPosition(
    const YGFlexDirection axis,
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
    const YGFlexDirection axis,
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

bool Node::isLeadingPositionDefined(const YGFlexDirection axis) const {
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

bool Node::isTrailingPosDefined(const YGFlexDirection axis) const {
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
    const YGFlexDirection axis,
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
    const YGFlexDirection axis,
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
    const YGFlexDirection axis,
    const float widthSize) const {
  return getLeadingMargin(axis, widthSize) + getTrailingMargin(axis, widthSize);
}

FloatOptional Node::getGapForAxis(
    const YGFlexDirection axis,
    const float widthSize) const {
  auto gap = isRow(axis)
      ? computeColumnGap(style_.gap(), CompactValue::ofZero())
      : computeRowGap(style_.gap(), CompactValue::ofZero());
  return yoga::resolveValue(gap, widthSize);
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

float Node::baseline(float width, float height, void* layoutContext) const {
  return flags_.baselineUsesContext
      ? baseline_.withContext(
            const_cast<Node*>(this), width, height, layoutContext)
      : baseline_.noContext(const_cast<Node*>(this), width, height);
}

// Setters

void Node::setMeasureFunc(decltype(Node::measure_) measureFunc) {
  if (measureFunc.noContext == nullptr) {
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(YGNodeTypeDefault);
  } else {
    yoga::assertFatalWithNode(
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

void Node::removeChild(size_t index) {
  children_.erase(children_.begin() + static_cast<ptrdiff_t>(index));
}

void Node::setLayoutDirection(YGDirection direction) {
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

void Node::setLayoutLastOwnerDirection(YGDirection direction) {
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
  layout_.measuredDimensions[static_cast<size_t>(dimension)] =
      measuredDimension;
}

void Node::setLayoutHadOverflow(bool hadOverflow) {
  layout_.setHadOverflow(hadOverflow);
}

void Node::setLayoutDimension(float dimensionValue, YGDimension dimension) {
  layout_.dimensions[static_cast<size_t>(dimension)] = dimensionValue;
}

// If both left and right are defined, then use left. Otherwise return +left or
// -right depending on which is defined.
FloatOptional Node::relativePosition(
    const YGFlexDirection axis,
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
    const YGDirection direction,
    const float mainSize,
    const float crossSize,
    const float ownerWidth) {
  /* Root nodes should be always layouted as LTR, so we don't return negative
   * values. */
  const YGDirection directionRespectingRoot =
      owner_ != nullptr ? direction : YGDirectionLTR;
  const YGFlexDirection mainAxis =
      yoga::resolveDirection(style_.flexDirection(), directionRespectingRoot);
  const YGFlexDirection crossAxis =
      yoga::resolveCrossDirection(mainAxis, directionRespectingRoot);

  // Here we should check for `YGPositionTypeStatic` and in this case zero inset
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

YGValue Node::marginLeadingValue(const YGFlexDirection axis) const {
  if (isRow(axis) && !style_.margin()[YGEdgeStart].isUndefined()) {
    return style_.margin()[YGEdgeStart];
  } else {
    return style_.margin()[leadingEdge(axis)];
  }
}

YGValue Node::marginTrailingValue(const YGFlexDirection axis) const {
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
    if (!style.maxDimensions()[dim].isUndefined() &&
        yoga::inexactEquals(
            style.maxDimensions()[dim], style.minDimensions()[dim])) {
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
    setLayoutComputedFlexBasis(FloatOptional());
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
      (style_.positionType() != YGPositionTypeAbsolute) &&
      (resolveFlexGrow() != 0 || resolveFlexShrink() != 0));
}

float Node::getLeadingBorder(const YGFlexDirection axis) const {
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

float Node::getTrailingBorder(const YGFlexDirection axis) const {
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
    const YGFlexDirection axis,
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
    const YGFlexDirection axis,
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
    const YGFlexDirection axis,
    const float widthSize) const {
  return getLeadingPadding(axis, widthSize) +
      FloatOptional(getLeadingBorder(axis));
}

FloatOptional Node::getTrailingPaddingAndBorder(
    const YGFlexDirection axis,
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
