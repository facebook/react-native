/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YogaLayoutableShadowNode.h"

#include <algorithm>
#include <limits>
#include <memory>

#include <react/components/view/ViewProps.h>
#include <react/components/view/conversions.h>
#include <react/core/LayoutConstraints.h>
#include <react/core/LayoutContext.h>
#include <react/debug/DebugStringConvertibleItem.h>
#include <react/debug/SystraceSection.h>
#include <yoga/Yoga.h>
#include <iostream>

namespace facebook {
namespace react {

static void applyLayoutConstraints(
    YGStyle &yogaStyle,
    LayoutConstraints const &layoutConstraints) {
  yogaStyle.minDimensions()[YGDimensionWidth] =
      yogaStyleValueFromFloat(layoutConstraints.minimumSize.width);
  yogaStyle.minDimensions()[YGDimensionHeight] =
      yogaStyleValueFromFloat(layoutConstraints.minimumSize.height);

  yogaStyle.maxDimensions()[YGDimensionWidth] =
      yogaStyleValueFromFloat(layoutConstraints.maximumSize.width);
  yogaStyle.maxDimensions()[YGDimensionHeight] =
      yogaStyleValueFromFloat(layoutConstraints.maximumSize.height);

  yogaStyle.direction() =
      yogaDirectionFromLayoutDirection(layoutConstraints.layoutDirection);
}

ShadowNodeTraits YogaLayoutableShadowNode::BaseTraits() {
  auto traits = LayoutableShadowNode::BaseTraits();
  traits.set(ShadowNodeTraits::Trait::YogaLayoutableKind);
  return traits;
}

YogaLayoutableShadowNode::YogaLayoutableShadowNode(
    ShadowNodeFragment const &fragment,
    ShadowNodeFamily::Shared const &family,
    ShadowNodeTraits traits)
    : LayoutableShadowNode(fragment, family, traits),
      yogaConfig_(nullptr),
      yogaNode_(&initializeYogaConfig(yogaConfig_)) {
  yogaNode_.setContext(this);

  updateYogaProps();
  updateYogaChildren();
}

YogaLayoutableShadowNode::YogaLayoutableShadowNode(
    ShadowNode const &sourceShadowNode,
    ShadowNodeFragment const &fragment)
    : LayoutableShadowNode(sourceShadowNode, fragment),
      yogaConfig_(nullptr),
      yogaNode_(
          static_cast<YogaLayoutableShadowNode const &>(sourceShadowNode)
              .yogaNode_,
          &initializeYogaConfig(yogaConfig_)) {
  yogaNode_.setContext(this);
  yogaNode_.setOwner(nullptr);

  // Yoga node must inherit dirty flag.
  assert(
      static_cast<YogaLayoutableShadowNode const &>(sourceShadowNode)
          .yogaNode_.isDirty() == yogaNode_.isDirty());

  if (fragment.props) {
    updateYogaProps();
  }

  if (fragment.children) {
    updateYogaChildren();
  }
}

void YogaLayoutableShadowNode::cleanLayout() {
  yogaNode_.setDirty(false);
}

void YogaLayoutableShadowNode::dirtyLayout() {
  yogaNode_.setDirty(true);
}

bool YogaLayoutableShadowNode::getIsLayoutClean() const {
  return !yogaNode_.isDirty();
}

bool YogaLayoutableShadowNode::getHasNewLayout() const {
  return yogaNode_.getHasNewLayout();
}

void YogaLayoutableShadowNode::setHasNewLayout(bool hasNewLayout) {
  yogaNode_.setHasNewLayout(hasNewLayout);
}

#pragma mark - Mutating Methods

void YogaLayoutableShadowNode::enableMeasurement() {
  ensureUnsealed();

  yogaNode_.setMeasureFunc(
      YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector);
}

void YogaLayoutableShadowNode::appendChild(ShadowNode::Shared const &child) {
  ensureUnsealed();

  LayoutableShadowNode::appendChild(child);

  auto yogaLayoutableChild =
      traitCast<YogaLayoutableShadowNode const *>(child.get());
  if (yogaLayoutableChild) {
    appendChildYogaNode(*yogaLayoutableChild);
  }
}

bool YogaLayoutableShadowNode::doesOwn(
    YogaLayoutableShadowNode const &child) const {
  return child.yogaNode_.getOwner() == &yogaNode_;
}

void YogaLayoutableShadowNode::appendChildYogaNode(
    YogaLayoutableShadowNode const &child) {
  ensureUnsealed();

  if (getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode)) {
    // This node is a declared leaf, therefore we must not add the Yoga node as
    // a child.
    return;
  }

  yogaNode_.setDirty(true);

  auto yogaNodeRawPtr = &yogaNode_;
  auto childYogaNodeRawPtr = &child.yogaNode_;
  auto childNodePtr = const_cast<YogaLayoutableShadowNode *>(&child);

  if (childYogaNodeRawPtr->getOwner() != nullptr) {
    childNodePtr =
        &cloneAndReplaceChild(*childNodePtr, yogaNode_.getChildren().size());
    childYogaNodeRawPtr = &childNodePtr->yogaNode_;
  }

  // Inserted node must have a clear owner (must not be shared).
  assert(childYogaNodeRawPtr->getOwner() == nullptr);

  childNodePtr->ensureUnsealed();
  childYogaNodeRawPtr->setOwner(yogaNodeRawPtr);

  yogaNodeRawPtr->insertChild(
      childYogaNodeRawPtr, yogaNodeRawPtr->getChildren().size());
}

void YogaLayoutableShadowNode::updateYogaChildren() {
  if (getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode)) {
    return;
  }

  ensureUnsealed();

  auto &children = getChildren();

  // Optimization:
  // If the new list of child nodes consists of clean nodes, and if their styles
  // are identical to styles of old children, we don't dirty the node.
  bool isClean = !yogaNode_.getDirtied() &&
      children.size() == yogaNode_.getChildren().size();
  auto oldChildren = isClean ? yogaNode_.getChildren() : YGVector{};

  yogaNode_.setChildren({});

  auto i = int{0};
  for (auto const &child : children) {
    auto yogaLayoutableChild =
        traitCast<YogaLayoutableShadowNode const *>(child.get());

    if (!yogaLayoutableChild) {
      continue;
    }

    appendChildYogaNode(*yogaLayoutableChild);

    isClean = isClean && !yogaLayoutableChild->yogaNode_.isDirty() &&
        yogaLayoutableChild->yogaNode_.getStyle() ==
            oldChildren[i++]->getStyle();
  }

  yogaNode_.setDirty(!isClean);
}

void YogaLayoutableShadowNode::updateYogaProps() {
  ensureUnsealed();

  auto props = static_cast<YogaStylableProps const &>(*props_);

  // Resetting `dirty` flag only if `yogaStyle` portion of `Props` was changed.
  if (!yogaNode_.isDirty() && (props.yogaStyle != yogaNode_.getStyle())) {
    yogaNode_.setDirty(true);
  }

  yogaNode_.setStyle(props.yogaStyle);
}

void YogaLayoutableShadowNode::setSize(Size size) const {
  ensureUnsealed();

  auto style = yogaNode_.getStyle();
  style.dimensions()[YGDimensionWidth] = yogaStyleValueFromFloat(size.width);
  style.dimensions()[YGDimensionHeight] = yogaStyleValueFromFloat(size.height);
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(true);
}

void YogaLayoutableShadowNode::setPadding(RectangleEdges<Float> padding) const {
  ensureUnsealed();

  auto style = yogaNode_.getStyle();
  style.padding()[YGEdgeTop] = yogaStyleValueFromFloat(padding.top);
  style.padding()[YGEdgeLeft] = yogaStyleValueFromFloat(padding.left);
  style.padding()[YGEdgeRight] = yogaStyleValueFromFloat(padding.right);
  style.padding()[YGEdgeBottom] = yogaStyleValueFromFloat(padding.bottom);
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(true);
}

void YogaLayoutableShadowNode::setPositionType(
    YGPositionType positionType) const {
  ensureUnsealed();

  auto style = yogaNode_.getStyle();
  style.positionType() = positionType;
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(true);
}

void YogaLayoutableShadowNode::layoutTree(
    LayoutContext layoutContext,
    LayoutConstraints layoutConstraints) {
  ensureUnsealed();

  /*
   * In Yoga, every single Yoga Node has to have a (non-null) pointer to
   * Yoga Config (this config can be shared between many nodes),
   * so every node can be individually configured. This does *not* mean
   * however that Yoga consults with every single Yoga Node Config for every
   * config parameter. Especially in case of `pointScaleFactor`,
   * the only value in the config of the root node is taken into account
   * (and this is by design).
   */
  yogaConfig_.pointScaleFactor = layoutContext.pointScaleFactor;

  applyLayoutConstraints(yogaNode_.getStyle(), layoutConstraints);

  if (layoutContext.swapLeftAndRightInRTL) {
    swapLeftAndRightInTree(*this);
  }

  {
    SystraceSection s("YogaLayoutableShadowNode::YGNodeCalculateLayout");

    YGNodeCalculateLayout(
        &yogaNode_, YGUndefined, YGUndefined, YGDirectionInherit);
  }

  if (getHasNewLayout()) {
    auto layoutMetrics = layoutMetricsFromYogaNode(yogaNode_);
    layoutMetrics.pointScaleFactor = layoutContext.pointScaleFactor;
    setLayoutMetrics(layoutMetrics);
    setHasNewLayout(false);
  }

  layout(layoutContext);
}

void YogaLayoutableShadowNode::layoutChildren(LayoutContext layoutContext) {
  assert(!yogaNode_.isDirty());

  for (const auto &childYogaNode : yogaNode_.getChildren()) {
    if (!childYogaNode->getHasNewLayout()) {
      continue;
    }

    assert(!childYogaNode->isDirty());

    auto childNode =
        static_cast<YogaLayoutableShadowNode *>(childYogaNode->getContext());

    // Verifying that the Yoga node belongs to the ShadowNode.
    assert(&childNode->yogaNode_ == childYogaNode);

    LayoutMetrics childLayoutMetrics =
        layoutMetricsFromYogaNode(childNode->yogaNode_);
    childLayoutMetrics.pointScaleFactor = layoutContext.pointScaleFactor;

    // We must copy layout metrics from Yoga node only once (when the parent
    // node exclusively ownes the child node).
    assert(childYogaNode->getOwner() == &yogaNode_);

    childNode->ensureUnsealed();
    auto affected = childNode->setLayoutMetrics(childLayoutMetrics);

    if (affected && layoutContext.affectedNodes) {
      layoutContext.affectedNodes->push_back(childNode);
    }
  }
}

YogaLayoutableShadowNode &YogaLayoutableShadowNode::cloneAndReplaceChild(
    YogaLayoutableShadowNode &child,
    int suggestedIndex) {
  auto clonedChildShadowNode = child.clone({});
  replaceChild(child, clonedChildShadowNode, suggestedIndex);

  return static_cast<YogaLayoutableShadowNode &>(*clonedChildShadowNode);
}

#pragma mark - Yoga Connectors

YGNode *YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector(
    YGNode *oldYogaNode,
    YGNode *parentYogaNode,
    int childIndex) {
  SystraceSection s("YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector");

  // At this point it is guaranteed that all shadow nodes associated with yoga
  // nodes are `YogaLayoutableShadowNode` subclasses.
  auto parentNode =
      static_cast<YogaLayoutableShadowNode *>(parentYogaNode->getContext());
  auto oldNode =
      static_cast<YogaLayoutableShadowNode *>(oldYogaNode->getContext());
  auto clonedNode = &parentNode->cloneAndReplaceChild(*oldNode, childIndex);
  return &clonedNode->yogaNode_;
}

YGSize YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector(
    YGNode *yogaNode,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode) {
  SystraceSection s(
      "YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector");

  auto shadowNodeRawPtr =
      static_cast<YogaLayoutableShadowNode *>(yogaNode->getContext());

  auto minimumSize = Size{0, 0};
  auto maximumSize = Size{std::numeric_limits<Float>::infinity(),
                          std::numeric_limits<Float>::infinity()};

  switch (widthMode) {
    case YGMeasureModeUndefined:
      break;
    case YGMeasureModeExactly:
      minimumSize.width = floatFromYogaFloat(width);
      maximumSize.width = floatFromYogaFloat(width);
      break;
    case YGMeasureModeAtMost:
      maximumSize.width = floatFromYogaFloat(width);
      break;
  }

  switch (heightMode) {
    case YGMeasureModeUndefined:
      break;
    case YGMeasureModeExactly:
      minimumSize.height = floatFromYogaFloat(height);
      maximumSize.height = floatFromYogaFloat(height);
      break;
    case YGMeasureModeAtMost:
      maximumSize.height = floatFromYogaFloat(height);
      break;
  }

  auto size = shadowNodeRawPtr->measure({minimumSize, maximumSize});

  return YGSize{yogaFloatFromFloat(size.width),
                yogaFloatFromFloat(size.height)};
}

YGConfig &YogaLayoutableShadowNode::initializeYogaConfig(YGConfig &config) {
  config.setCloneNodeCallback(
      YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector);
  config.useLegacyStretchBehaviour = true;
  return config;
}

#pragma mark - RTL left and right swapping

void YogaLayoutableShadowNode::swapLeftAndRightInTree(
    YogaLayoutableShadowNode const &shadowNode) {
  swapLeftAndRightInYogaStyleProps(shadowNode);
  swapLeftAndRightInViewProps(shadowNode);

  for (auto &child : shadowNode.getChildren()) {
    auto const yogaLayoutableChild =
        traitCast<YogaLayoutableShadowNode const *>(child.get());
    if (yogaLayoutableChild && !yogaLayoutableChild->doesOwn(shadowNode)) {
      swapLeftAndRightInTree(*yogaLayoutableChild);
    }
  }
}

void YogaLayoutableShadowNode::swapLeftAndRightInYogaStyleProps(
    YogaLayoutableShadowNode const &shadowNode) {
  auto yogaStyle = shadowNode.yogaNode_.getStyle();

  YGStyle::Edges const &position = yogaStyle.position();
  YGStyle::Edges const &padding = yogaStyle.padding();
  YGStyle::Edges const &margin = yogaStyle.margin();

  // Swap Yoga node values, position, padding and margin.

  if (yogaStyle.position()[YGEdgeLeft] != YGValueUndefined) {
    yogaStyle.position()[YGEdgeStart] = position[YGEdgeLeft];
    yogaStyle.position()[YGEdgeLeft] = YGValueUndefined;
  }

  if (yogaStyle.position()[YGEdgeRight] != YGValueUndefined) {
    yogaStyle.position()[YGEdgeEnd] = position[YGEdgeRight];
    yogaStyle.position()[YGEdgeRight] = YGValueUndefined;
  }

  if (yogaStyle.padding()[YGEdgeLeft] != YGValueUndefined) {
    yogaStyle.padding()[YGEdgeStart] = padding[YGEdgeLeft];
    yogaStyle.padding()[YGEdgeLeft] = YGValueUndefined;
  }

  if (yogaStyle.padding()[YGEdgeRight] != YGValueUndefined) {
    yogaStyle.padding()[YGEdgeEnd] = padding[YGEdgeRight];
    yogaStyle.padding()[YGEdgeRight] = YGValueUndefined;
  }

  if (yogaStyle.margin()[YGEdgeLeft] != YGValueUndefined) {
    yogaStyle.margin()[YGEdgeStart] = margin[YGEdgeLeft];
    yogaStyle.margin()[YGEdgeLeft] = YGValueUndefined;
  }

  if (yogaStyle.margin()[YGEdgeRight] != YGValueUndefined) {
    yogaStyle.margin()[YGEdgeEnd] = margin[YGEdgeRight];
    yogaStyle.margin()[YGEdgeLeft] = YGValueUndefined;
  }

  shadowNode.yogaNode_.setStyle(yogaStyle);
}

void YogaLayoutableShadowNode::swapLeftAndRightInViewProps(
    YogaLayoutableShadowNode const &shadowNode) {
  auto &typedCasting = static_cast<ViewProps const &>(*shadowNode.props_);
  auto &props = const_cast<ViewProps &>(typedCasting);

  // Swap border node values, borderRadii, borderColors and borderStyles.
  if (props.borderRadii.topLeft.hasValue()) {
    props.borderRadii.topStart = props.borderRadii.topLeft;
    props.borderRadii.topLeft.clear();
  }

  if (props.borderRadii.bottomLeft.hasValue()) {
    props.borderRadii.bottomStart = props.borderRadii.bottomLeft;
    props.borderRadii.bottomLeft.clear();
  }

  if (props.borderRadii.topRight.hasValue()) {
    props.borderRadii.topEnd = props.borderRadii.topRight;
    props.borderRadii.topRight.clear();
  }

  if (props.borderRadii.bottomRight.hasValue()) {
    props.borderRadii.bottomEnd = props.borderRadii.bottomRight;
    props.borderRadii.bottomRight.clear();
  }

  if (props.borderColors.left.hasValue()) {
    props.borderColors.start = props.borderColors.left;
    props.borderColors.left.clear();
  }

  if (props.borderColors.right.hasValue()) {
    props.borderColors.end = props.borderColors.right;
    props.borderColors.right.clear();
  }

  if (props.borderStyles.left.hasValue()) {
    props.borderStyles.start = props.borderStyles.left;
    props.borderStyles.left.clear();
  }

  if (props.borderStyles.right.hasValue()) {
    props.borderStyles.end = props.borderStyles.right;
    props.borderStyles.right.clear();
  }

  YGStyle::Edges const &border = props.yogaStyle.border();

  if (props.yogaStyle.border()[YGEdgeLeft] != YGValueUndefined) {
    props.yogaStyle.border()[YGEdgeStart] = border[YGEdgeLeft];
    props.yogaStyle.border()[YGEdgeLeft] = YGValueUndefined;
  }

  if (props.yogaStyle.border()[YGEdgeRight] != YGValueUndefined) {
    props.yogaStyle.border()[YGEdgeEnd] = border[YGEdgeRight];
    props.yogaStyle.border()[YGEdgeRight] = YGValueUndefined;
  }
}

} // namespace react
} // namespace facebook
