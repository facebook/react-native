/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YogaLayoutableShadowNode.h"

#include <algorithm>
#include <memory>

#include <react/components/view/conversions.h>
#include <react/core/LayoutConstraints.h>
#include <react/core/LayoutContext.h>
#include <react/debug/DebugStringConvertibleItem.h>
#include <yoga/Yoga.h>

namespace facebook {
namespace react {

YogaLayoutableShadowNode::YogaLayoutableShadowNode()
    : yogaNode_({}), yogaConfig_(nullptr) {
  initializeYogaConfig(yogaConfig_);

  yogaNode_.setConfig(&yogaConfig_);
  yogaNode_.setContext(this);
  yogaNode_.setDirty(true);
}

YogaLayoutableShadowNode::YogaLayoutableShadowNode(
    const YogaLayoutableShadowNode &layoutableShadowNode)
    : yogaNode_(layoutableShadowNode.yogaNode_), yogaConfig_(nullptr) {
  initializeYogaConfig(yogaConfig_);

  yogaNode_.setConfig(&yogaConfig_);
  yogaNode_.setContext(this);
  yogaNode_.setOwner(nullptr);
  yogaNode_.setDirty(true);
}

void YogaLayoutableShadowNode::cleanLayout() {
  yogaNode_.setDirty(false);
}

void YogaLayoutableShadowNode::dirtyLayout() {
  yogaNode_.markDirtyAndPropogate();
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

void YogaLayoutableShadowNode::appendChild(YogaLayoutableShadowNode *child) {
  ensureUnsealed();

  auto yogaNodeRawPtr = &yogaNode_;
  auto childYogaNodeRawPtr = &child->yogaNode_;

  if (childYogaNodeRawPtr->getOwner() != nullptr) {
    child = static_cast<YogaLayoutableShadowNode *>(
        cloneAndReplaceChild(child, yogaNode_.getChildren().size()));
    childYogaNodeRawPtr = &child->yogaNode_;
    assert(childYogaNodeRawPtr->getOwner() == nullptr);
  }

  child->ensureUnsealed();
  childYogaNodeRawPtr->setOwner(yogaNodeRawPtr);

  yogaNodeRawPtr->insertChild(
      childYogaNodeRawPtr, yogaNodeRawPtr->getChildren().size());
}

void YogaLayoutableShadowNode::setChildren(
    std::vector<YogaLayoutableShadowNode *> children) {
  yogaNode_.setChildren({});
  for (const auto &child : children) {
    appendChild(child);
  }
}

void YogaLayoutableShadowNode::setProps(const YogaStylableProps &props) {
  yogaNode_.setStyle(props.yogaStyle);
}

void YogaLayoutableShadowNode::layout(LayoutContext layoutContext) {
  if (!getIsLayoutClean()) {
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
    YGNodeCalculateLayout(
        &yogaNode_, YGUndefined, YGUndefined, YGDirectionInherit);
  }

  LayoutableShadowNode::layout(layoutContext);
}

void YogaLayoutableShadowNode::layoutChildren(LayoutContext layoutContext) {
  for (const auto &childYogaNode : yogaNode_.getChildren()) {
    auto childNode =
        static_cast<YogaLayoutableShadowNode *>(childYogaNode->getContext());

    LayoutMetrics childLayoutMetrics =
        layoutMetricsFromYogaNode(childNode->yogaNode_);
    childLayoutMetrics.pointScaleFactor = layoutContext.pointScaleFactor;
    childNode->setLayoutMetrics(childLayoutMetrics);
  }
}

std::vector<LayoutableShadowNode *>
YogaLayoutableShadowNode::getLayoutableChildNodes() const {
  std::vector<LayoutableShadowNode *> yogaLayoutableChildNodes;
  yogaLayoutableChildNodes.reserve(yogaNode_.getChildren().size());

  for (const auto &childYogaNode : yogaNode_.getChildren()) {
    auto childNode =
        static_cast<YogaLayoutableShadowNode *>(childYogaNode->getContext());
    yogaLayoutableChildNodes.push_back(childNode);
  }

  return yogaLayoutableChildNodes;
}

#pragma mark - Yoga Connectors

YGNode *YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector(
    YGNode *oldYogaNode,
    YGNode *parentYogaNode,
    int childIndex) {
  // At this point it is garanteed that all shadow nodes associated with yoga
  // nodes are `YogaLayoutableShadowNode` subclasses.
  auto parentNode =
      static_cast<YogaLayoutableShadowNode *>(parentYogaNode->getContext());
  auto oldNode =
      static_cast<YogaLayoutableShadowNode *>(oldYogaNode->getContext());
  auto clonedNode = static_cast<YogaLayoutableShadowNode *>(
      parentNode->cloneAndReplaceChild(oldNode, childIndex));
  return &clonedNode->yogaNode_;
}

YGSize YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector(
    YGNode *yogaNode,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode) {
  auto shadowNodeRawPtr =
      static_cast<YogaLayoutableShadowNode *>(yogaNode->getContext());

  auto minimumSize = Size{0, 0};
  auto maximumSize = Size{kFloatMax, kFloatMax};

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

void YogaLayoutableShadowNode::initializeYogaConfig(YGConfig &config) {
  config.cloneNodeCallback =
      YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector;
}

} // namespace react
} // namespace facebook
