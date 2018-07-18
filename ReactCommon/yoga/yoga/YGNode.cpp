/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include "YGNode.h"
#include <iostream>
#include "Utils.h"

using namespace facebook;

YGFloatOptional YGNode::getLeadingPosition(
    const YGFlexDirection& axis,
    const float& axisSize) const {
  if (YGFlexDirectionIsRow(axis)) {
    const YGValue* leadingPosition =
        YGComputedEdgeValue(style_.position, YGEdgeStart, &YGValueUndefined);
    if (leadingPosition->unit != YGUnitUndefined) {
      return YGResolveValue(*leadingPosition, axisSize);
    }
  }

  const YGValue* leadingPosition =
      YGComputedEdgeValue(style_.position, leading[axis], &YGValueUndefined);

  return leadingPosition->unit == YGUnitUndefined
      ? YGFloatOptional(0)
      : YGResolveValue(*leadingPosition, axisSize);
}

YGFloatOptional YGNode::getTrailingPosition(
    const YGFlexDirection& axis,
    const float& axisSize) const {
  if (YGFlexDirectionIsRow(axis)) {
    const YGValue* trailingPosition =
        YGComputedEdgeValue(style_.position, YGEdgeEnd, &YGValueUndefined);
    if (trailingPosition->unit != YGUnitUndefined) {
      return YGResolveValue(*trailingPosition, axisSize);
    }
  }

  const YGValue* trailingPosition =
      YGComputedEdgeValue(style_.position, trailing[axis], &YGValueUndefined);

  return trailingPosition->unit == YGUnitUndefined
      ? YGFloatOptional(0)
      : YGResolveValue(*trailingPosition, axisSize);
}

bool YGNode::isLeadingPositionDefined(const YGFlexDirection& axis) const {
  return (YGFlexDirectionIsRow(axis) &&
          YGComputedEdgeValue(style_.position, YGEdgeStart, &YGValueUndefined)
                  ->unit != YGUnitUndefined) ||
      YGComputedEdgeValue(style_.position, leading[axis], &YGValueUndefined)
          ->unit != YGUnitUndefined;
}

bool YGNode::isTrailingPosDefined(const YGFlexDirection& axis) const {
  return (YGFlexDirectionIsRow(axis) &&
          YGComputedEdgeValue(style_.position, YGEdgeEnd, &YGValueUndefined)
                  ->unit != YGUnitUndefined) ||
      YGComputedEdgeValue(style_.position, trailing[axis], &YGValueUndefined)
          ->unit != YGUnitUndefined;
}

YGFloatOptional YGNode::getLeadingMargin(
    const YGFlexDirection& axis,
    const float& widthSize) const {
  if (YGFlexDirectionIsRow(axis) &&
      style_.margin[YGEdgeStart].unit != YGUnitUndefined) {
    return YGResolveValueMargin(style_.margin[YGEdgeStart], widthSize);
  }

  return YGResolveValueMargin(
      *YGComputedEdgeValue(style_.margin, leading[axis], &YGValueZero),
      widthSize);
}

YGFloatOptional YGNode::getTrailingMargin(
    const YGFlexDirection& axis,
    const float& widthSize) const {
  if (YGFlexDirectionIsRow(axis) &&
      style_.margin[YGEdgeEnd].unit != YGUnitUndefined) {
    return YGResolveValueMargin(style_.margin[YGEdgeEnd], widthSize);
  }

  return YGResolveValueMargin(
      *YGComputedEdgeValue(style_.margin, trailing[axis], &YGValueZero),
      widthSize);
}

YGFloatOptional YGNode::getMarginForAxis(
    const YGFlexDirection& axis,
    const float& widthSize) const {
  return getLeadingMargin(axis, widthSize) + getTrailingMargin(axis, widthSize);
}

// Setters

void YGNode::setMeasureFunc(YGMeasureFunc measureFunc) {
  if (measureFunc == nullptr) {
    measure_ = nullptr;
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    nodeType_ = YGNodeTypeDefault;
  } else {
    YGAssertWithNode(
        this,
        children_.size() == 0,
        "Cannot set measure function: Nodes with measure functions cannot have children.");
    measure_ = measureFunc;
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(YGNodeTypeText);
  }

  measure_ = measureFunc;
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

void YGNode::setDirty(bool isDirty) {
  if (isDirty == isDirty_) {
    return;
  }
  isDirty_ = isDirty;
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
  layout_.direction = direction;
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
    const YGFloatOptional& computedFlexBasis) {
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
  layout_.hadOverflow = hadOverflow;
}

void YGNode::setLayoutDimension(float dimension, int index) {
  layout_.dimensions[index] = dimension;
}

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
YGFloatOptional YGNode::relativePosition(
    const YGFlexDirection& axis,
    const float& axisSize) const {
  if (isLeadingPositionDefined(axis)) {
    return getLeadingPosition(axis, axisSize);
  }

  YGFloatOptional trailingPosition = getTrailingPosition(axis, axisSize);
  if (!trailingPosition.isUndefined()) {
    trailingPosition.setValue(-1 * trailingPosition.getValue());
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
      YGResolveFlexDirection(style_.flexDirection, directionRespectingRoot);
  const YGFlexDirection crossAxis =
      YGFlexDirectionCross(mainAxis, directionRespectingRoot);

  const YGFloatOptional relativePositionMain =
      relativePosition(mainAxis, mainSize);
  const YGFloatOptional relativePositionCross =
      relativePosition(crossAxis, crossSize);

  setLayoutPosition(
      YGUnwrapFloatOptional(
          getLeadingMargin(mainAxis, ownerWidth) + relativePositionMain),
      leading[mainAxis]);
  setLayoutPosition(
      YGUnwrapFloatOptional(
          getTrailingMargin(mainAxis, ownerWidth) + relativePositionMain),
      trailing[mainAxis]);
  setLayoutPosition(
      YGUnwrapFloatOptional(
          getLeadingMargin(crossAxis, ownerWidth) + relativePositionCross),
      leading[crossAxis]);
  setLayoutPosition(
      YGUnwrapFloatOptional(
          getTrailingMargin(crossAxis, ownerWidth) + relativePositionCross),
      trailing[crossAxis]);
}

YGNode::YGNode()
    : context_(nullptr),
      print_(nullptr),
      hasNewLayout_(true),
      nodeType_(YGNodeTypeDefault),
      measure_(nullptr),
      baseline_(nullptr),
      dirtied_(nullptr),
      style_(YGStyle()),
      layout_(YGLayout()),
      lineIndex_(0),
      owner_(nullptr),
      children_(YGVector()),
      config_(nullptr),
      isDirty_(false),
      resolvedDimensions_({{YGValueUndefined, YGValueUndefined}}) {}

YGNode::YGNode(const YGNode& node) = default;

YGNode::YGNode(const YGConfigRef newConfig) : YGNode() {
  config_ = newConfig;
}

YGNode& YGNode::operator=(const YGNode& node) {
  if (&node == this) {
    return *this;
  }

  for (auto child : children_) {
    delete child;
  }

  context_ = node.getContext();
  print_ = node.getPrintFunc();
  hasNewLayout_ = node.getHasNewLayout();
  nodeType_ = node.getNodeType();
  measure_ = node.getMeasure();
  baseline_ = node.getBaseline();
  dirtied_ = node.getDirtied();
  style_ = node.style_;
  layout_ = node.layout_;
  lineIndex_ = node.getLineIndex();
  owner_ = node.getOwner();
  children_ = node.getChildren();
  config_ = node.getConfig();
  isDirty_ = node.isDirty();
  resolvedDimensions_ = node.getResolvedDimensions();

  return *this;
}

YGValue YGNode::marginLeadingValue(const YGFlexDirection axis) const {
  if (YGFlexDirectionIsRow(axis) &&
      style_.margin[YGEdgeStart].unit != YGUnitUndefined) {
    return style_.margin[YGEdgeStart];
  } else {
    return style_.margin[leading[axis]];
  }
}

YGValue YGNode::marginTrailingValue(const YGFlexDirection axis) const {
  if (YGFlexDirectionIsRow(axis) &&
      style_.margin[YGEdgeEnd].unit != YGUnitUndefined) {
    return style_.margin[YGEdgeEnd];
  } else {
    return style_.margin[trailing[axis]];
  }
}

YGValue YGNode::resolveFlexBasisPtr() const {
  YGValue flexBasis = style_.flexBasis;
  if (flexBasis.unit != YGUnitAuto && flexBasis.unit != YGUnitUndefined) {
    return flexBasis;
  }
  if (!style_.flex.isUndefined() && style_.flex.getValue() > 0.0f) {
    return config_->useWebDefaults ? YGValueAuto : YGValueZero;
  }
  return YGValueAuto;
}

void YGNode::resolveDimension() {
  for (uint32_t dim = YGDimensionWidth; dim < YGDimensionCount; dim++) {
    if (getStyle().maxDimensions[dim].unit != YGUnitUndefined &&
        YGValueEqual(
            getStyle().maxDimensions[dim], style_.minDimensions[dim])) {
      resolvedDimensions_[dim] = style_.maxDimensions[dim];
    } else {
      resolvedDimensions_[dim] = style_.dimensions[dim];
    }
  }
}

YGDirection YGNode::resolveDirection(const YGDirection ownerDirection) {
  if (style_.direction == YGDirectionInherit) {
    return ownerDirection > YGDirectionInherit ? ownerDirection
                                               : YGDirectionLTR;
  } else {
    return style_.direction;
  }
}

void YGNode::clearChildren() {
  children_.clear();
  children_.shrink_to_fit();
}

YGNode::~YGNode() {
  // All the member variables are deallocated externally, so no need to
  // deallocate here
}

// Other Methods

void YGNode::cloneChildrenIfNeeded() {
  // YGNodeRemoveChild in yoga.cpp has a forked variant of this algorithm
  // optimized for deletions.

  const uint32_t childCount = static_cast<uint32_t>(children_.size());
  if (childCount == 0) {
    // This is an empty set. Nothing to clone.
    return;
  }

  const YGNodeRef firstChild = children_.front();
  if (firstChild->getOwner() == this) {
    // If the first child has this node as its owner, we assume that it is
    // already unique. We can do this because if we have it has a child, that
    // means that its owner was at some point cloned which made that subtree
    // immutable. We also assume that all its sibling are cloned as well.
    return;
  }

  const YGCloneNodeFunc cloneNodeCallback = config_->cloneNodeCallback;
  for (uint32_t i = 0; i < childCount; ++i) {
    const YGNodeRef oldChild = children_[i];
    YGNodeRef newChild = nullptr;
    if (cloneNodeCallback) {
      newChild = cloneNodeCallback(oldChild, this, i);
    }
    if (newChild == nullptr) {
      newChild = YGNodeClone(oldChild);
    }
    replaceChild(newChild, i);
    newChild->setOwner(this);
  }
}

void YGNode::markDirtyAndPropogate() {
  if (!isDirty_) {
    setDirty(true);
    setLayoutComputedFlexBasis(YGFloatOptional());
    if (owner_) {
      owner_->markDirtyAndPropogate();
    }
  }
}

void YGNode::markDirtyAndPropogateDownwards() {
  isDirty_ = true;
  for_each(children_.begin(), children_.end(), [](YGNodeRef childNode) {
    childNode->markDirtyAndPropogateDownwards();
  });
}

float YGNode::resolveFlexGrow() {
  // Root nodes flexGrow should always be 0
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (!style_.flexGrow.isUndefined()) {
    return style_.flexGrow.getValue();
  }
  if (!style_.flex.isUndefined() && style_.flex.getValue() > 0.0f) {
    return style_.flex.getValue();
  }
  return kDefaultFlexGrow;
}

float YGNode::resolveFlexShrink() {
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (!style_.flexShrink.isUndefined()) {
    return style_.flexShrink.getValue();
  }
  if (!config_->useWebDefaults && !style_.flex.isUndefined() &&
      style_.flex.getValue() < 0.0f) {
    return -style_.flex.getValue();
  }
  return config_->useWebDefaults ? kWebDefaultFlexShrink : kDefaultFlexShrink;
}

bool YGNode::isNodeFlexible() {
  return (
      (style_.positionType == YGPositionTypeRelative) &&
      (resolveFlexGrow() != 0 || resolveFlexShrink() != 0));
}

float YGNode::getLeadingBorder(const YGFlexDirection& axis) const {
  if (YGFlexDirectionIsRow(axis) &&
      style_.border[YGEdgeStart].unit != YGUnitUndefined &&
      !yoga::isUndefined(style_.border[YGEdgeStart].value) &&
      style_.border[YGEdgeStart].value >= 0.0f) {
    return style_.border[YGEdgeStart].value;
  }

  float computedEdgeValue =
      YGComputedEdgeValue(style_.border, leading[axis], &YGValueZero)->value;
  return YGFloatMax(computedEdgeValue, 0.0f);
}

float YGNode::getTrailingBorder(const YGFlexDirection& flexDirection) const {
  if (YGFlexDirectionIsRow(flexDirection) &&
      style_.border[YGEdgeEnd].unit != YGUnitUndefined &&
      !yoga::isUndefined(style_.border[YGEdgeEnd].value) &&
      style_.border[YGEdgeEnd].value >= 0.0f) {
    return style_.border[YGEdgeEnd].value;
  }

  float computedEdgeValue =
      YGComputedEdgeValue(style_.border, trailing[flexDirection], &YGValueZero)
          ->value;
  return YGFloatMax(computedEdgeValue, 0.0f);
}

YGFloatOptional YGNode::getLeadingPadding(
    const YGFlexDirection& axis,
    const float& widthSize) const {
  const YGFloatOptional& paddingEdgeStart =
      YGResolveValue(style_.padding[YGEdgeStart], widthSize);
  if (YGFlexDirectionIsRow(axis) &&
      style_.padding[YGEdgeStart].unit != YGUnitUndefined &&
      !paddingEdgeStart.isUndefined() && paddingEdgeStart.getValue() > 0.0f) {
    return paddingEdgeStart;
  }

  YGFloatOptional resolvedValue = YGResolveValue(
      *YGComputedEdgeValue(style_.padding, leading[axis], &YGValueZero),
      widthSize);
  return YGFloatOptionalMax(resolvedValue, YGFloatOptional(0.0f));
}

YGFloatOptional YGNode::getTrailingPadding(
    const YGFlexDirection& axis,
    const float& widthSize) const {
  if (YGFlexDirectionIsRow(axis) &&
      style_.padding[YGEdgeEnd].unit != YGUnitUndefined &&
      !YGResolveValue(style_.padding[YGEdgeEnd], widthSize).isUndefined() &&
      YGResolveValue(style_.padding[YGEdgeEnd], widthSize).getValue() >= 0.0f) {
    return YGResolveValue(style_.padding[YGEdgeEnd], widthSize);
  }

  YGFloatOptional resolvedValue = YGResolveValue(
      *YGComputedEdgeValue(style_.padding, trailing[axis], &YGValueZero),
      widthSize);

  return YGFloatOptionalMax(resolvedValue, YGFloatOptional(0.0f));
}

YGFloatOptional YGNode::getLeadingPaddingAndBorder(
    const YGFlexDirection& axis,
    const float& widthSize) const {
  return getLeadingPadding(axis, widthSize) +
      YGFloatOptional(getLeadingBorder(axis));
}

YGFloatOptional YGNode::getTrailingPaddingAndBorder(
    const YGFlexDirection& axis,
    const float& widthSize) const {
  return getTrailingPadding(axis, widthSize) +
      YGFloatOptional(getTrailingBorder(axis));
}

bool YGNode::didUseLegacyFlag() {
  bool didUseLegacyFlag = layout_.didUseLegacyFlag;
  if (didUseLegacyFlag) {
    return true;
  }
  for (const auto& child : children_) {
    if (child->layout_.didUseLegacyFlag) {
      didUseLegacyFlag = true;
      break;
    }
  }
  return didUseLegacyFlag;
}

void YGNode::setAndPropogateUseLegacyFlag(bool useLegacyFlag) {
  config_->useLegacyStretchBehaviour = useLegacyFlag;
  for_each(children_.begin(), children_.end(), [=](YGNodeRef childNode) {
    childNode->getConfig()->useLegacyStretchBehaviour = useLegacyFlag;
  });
}

void YGNode::setLayoutDoesLegacyFlagAffectsLayout(
    bool doesLegacyFlagAffectsLayout) {
  layout_.doesLegacyStretchFlagAffectsLayout = doesLegacyFlagAffectsLayout;
}

void YGNode::setLayoutDidUseLegacyFlag(bool didUseLegacyFlag) {
  layout_.didUseLegacyFlag = didUseLegacyFlag;
}

bool YGNode::isLayoutTreeEqualToNode(const YGNode& node) const {
  if (children_.size() != node.children_.size()) {
    return false;
  }
  if (layout_ != node.layout_) {
    return false;
  }
  if (children_.size() == 0) {
    return true;
  }

  bool isLayoutTreeEqual = true;
  YGNodeRef otherNodeChildren = nullptr;
  for (std::vector<YGNodeRef>::size_type i = 0; i < children_.size(); ++i) {
    otherNodeChildren = node.children_[i];
    isLayoutTreeEqual =
        children_[i]->isLayoutTreeEqualToNode(*otherNodeChildren);
    if (!isLayoutTreeEqual) {
      return false;
    }
  }
  return isLayoutTreeEqual;
}
