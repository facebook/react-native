/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YogaLayoutableShadowNode.h"

#include <algorithm>
#include <memory>

#include <yoga/Yoga.h>
#include <fabric/core/LayoutContext.h>
#include <fabric/core/LayoutConstraints.h>
#include <fabric/debug/DebugStringConvertibleItem.h>

#include "yogaValuesConversions.h"

namespace facebook {
namespace react {

SharedYogaConfig YogaLayoutableShadowNode::suitableYogaConfig() {
  static SharedYogaConfig sharedYogaConfig;

  if (!sharedYogaConfig) {
    sharedYogaConfig = std::shared_ptr<YGConfig>(YGConfigNew());
    sharedYogaConfig->cloneNodeCallback = YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector;
  }

  return sharedYogaConfig;
}

YogaLayoutableShadowNode::YogaLayoutableShadowNode(
  const SharedYogaStylableProps &props,
  const SharedShadowNodeSharedList &children
) {
  assert(props);
  assert(children);

  auto yogaNode = std::make_shared<YGNode>();
  yogaNode->setConfig(suitableYogaConfig().get());
  yogaNode->setStyle(props->getYogaStyle());
  yogaNode->setContext(this);
  yogaNode->setDirty(true);
  YogaLayoutableShadowNode::setYogaNodeChildrenBasedOnShadowNodeChildren(*yogaNode, children);
  yogaNode_ = yogaNode;
}

YogaLayoutableShadowNode::YogaLayoutableShadowNode(
  const SharedYogaLayoutableShadowNode &shadowNode,
  const SharedYogaStylableProps &props,
  const SharedShadowNodeSharedList &children
) {
  auto yogaNode = std::make_shared<YGNode>(*shadowNode->yogaNode_);
  yogaNode->setConfig(suitableYogaConfig().get());
  yogaNode->setContext(this);
  yogaNode->setOwner(nullptr);
  yogaNode->setDirty(true);

  if (props) {
    yogaNode->setStyle(props->getYogaStyle());
  }

  if (children) {
    YogaLayoutableShadowNode::setYogaNodeChildrenBasedOnShadowNodeChildren(*yogaNode, children);
  }

  yogaNode_ = yogaNode;
}

void YogaLayoutableShadowNode::cleanLayout() {
  yogaNode_->setDirty(false);
}

void YogaLayoutableShadowNode::dirtyLayout() {
  yogaNode_->markDirtyAndPropogate();
}

bool YogaLayoutableShadowNode::getIsLayoutClean() const {
  return !yogaNode_->isDirty();
}

bool YogaLayoutableShadowNode::getHasNewLayout() const {
  return yogaNode_->getHasNewLayout();
}

void YogaLayoutableShadowNode::setHasNewLayout(bool hasNewLayout) {
  yogaNode_->setHasNewLayout(hasNewLayout);
}

#pragma mark - Mutating Methods

void YogaLayoutableShadowNode::enableMeasurement() {
  ensureUnsealed();

  yogaNode_->setMeasureFunc(YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector);
}

void YogaLayoutableShadowNode::appendChild(SharedYogaLayoutableShadowNode child) {
  ensureUnsealed();

  auto nonConstYogaNode = std::const_pointer_cast<YGNode>(yogaNode_);
  auto nonConstChildYogaNode = std::const_pointer_cast<YGNode>(child->yogaNode_);
  nonConstYogaNode->insertChild(nonConstChildYogaNode.get(), nonConstYogaNode->getChildrenCount());

  if (nonConstChildYogaNode->getOwner() == nullptr) {
    child->ensureUnsealed();
    nonConstChildYogaNode->setOwner(nonConstYogaNode.get());
  }
}

void YogaLayoutableShadowNode::layout(LayoutContext layoutContext) {
  if (!getIsLayoutClean()) {
    ensureUnsealed();
    YGNode *yogaNode = const_cast<YGNode *>(yogaNode_.get());
    YGNodeCalculateLayout(yogaNode, YGUndefined, YGUndefined, YGDirectionInherit);
  }

  LayoutableShadowNode::layout(layoutContext);
}

void YogaLayoutableShadowNode::layoutChildren(LayoutContext layoutContext) {
  for (auto child : getLayoutableChildNodes()) {
    auto yogaLayoutableChild = std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(child);
    if (!yogaLayoutableChild) {
      continue;
    }

    auto nonConstYogaLayoutableChild = std::const_pointer_cast<YogaLayoutableShadowNode>(yogaLayoutableChild);

    LayoutMetrics childLayoutMetrics = layoutMetricsFromYogaNode(*nonConstYogaLayoutableChild->yogaNode_);
    bool isAffected = nonConstYogaLayoutableChild->setLayoutMetrics(childLayoutMetrics);
    if (isAffected) {
      layoutContext.affectedShadowNodes->insert(child);
    }
  }
}

#pragma mark - Yoga Connectors

YGNode *YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector(YGNode *oldYogaNode, YGNode *parentYogaNode, int childIndex) {
  // We have only raw pointer to the parent shadow node, but that's enough for now.
  YogaLayoutableShadowNode *parentShadowNodeRawPtr = (YogaLayoutableShadowNode *)parentYogaNode->getContext();
  assert(parentShadowNodeRawPtr);

  // Old child shadow node already exists but we have only raw pointer to it...
  YogaLayoutableShadowNode *oldShadowNodeRawPtr = (YogaLayoutableShadowNode *)oldYogaNode->getContext();
  assert(oldShadowNodeRawPtr);

  // ... but we have to address this by `shared_ptr`. We cannot create a new `shared_ptr` for it because we will end up with two shared pointers to
  // single object which will cause preluminary destroyng the object.
  // Another approaches to consider:
  //  * Create a new `shared_ptr` with empty deleter.
  //  * Using `childIndex` to find exact node.
  SharedLayoutableShadowNode oldShadowNode = nullptr;
  for (auto child : parentShadowNodeRawPtr->getLayoutableChildNodes()) {
    if (child.get() == oldShadowNodeRawPtr) {
      oldShadowNode = child;
      break;
    }
  }

  assert(oldShadowNode);

  // The new one does not exist yet. So, we have to clone and replace this using `cloneAndReplaceChild`.
  SharedYogaLayoutableShadowNode newShadowNode =
    std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(parentShadowNodeRawPtr->cloneAndReplaceChild(oldShadowNode));
  assert(newShadowNode);

  return newShadowNode->yogaNode_.get();
}

YGSize YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector(YGNode *yogaNode, float width, YGMeasureMode widthMode, float height, YGMeasureMode heightMode) {
  YogaLayoutableShadowNode *shadowNodeRawPtr = (YogaLayoutableShadowNode *)yogaNode->getContext();
  assert(shadowNodeRawPtr);

  Size minimumSize = Size {0, 0};
  Size maximumSize = Size {kFloatMax, kFloatMax};

  switch (widthMode) {
    case YGMeasureModeUndefined:
      break;
    case YGMeasureModeExactly:
      minimumSize.width = fabricFloatFromYogaFloat(width);
      maximumSize.width = fabricFloatFromYogaFloat(width);
      break;
    case YGMeasureModeAtMost:
      maximumSize.width = fabricFloatFromYogaFloat(width);
      break;
  }

  switch (heightMode) {
    case YGMeasureModeUndefined:
      break;
    case YGMeasureModeExactly:
      minimumSize.height = fabricFloatFromYogaFloat(height);
      maximumSize.height = fabricFloatFromYogaFloat(height);
      break;
    case YGMeasureModeAtMost:
      maximumSize.height = fabricFloatFromYogaFloat(height);
      break;
  }

  Size size = shadowNodeRawPtr->measure(LayoutConstraints {minimumSize, maximumSize});

  return YGSize {
    yogaFloatFromFabricFloat(size.width),
    yogaFloatFromFabricFloat(size.height)
  };
}

void YogaLayoutableShadowNode::setYogaNodeChildrenBasedOnShadowNodeChildren(YGNode &yogaNode, const SharedShadowNodeSharedList &children) {
  auto yogaNodeChildren = YGVector();

  for (const SharedShadowNode &shadowNode : *children) {
    const SharedYogaLayoutableShadowNode yogaLayoutableShadowNode = std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(shadowNode);

    if (!yogaLayoutableShadowNode) {
      continue;
    }

    YGNode *yogaNodeChild = (YGNode *)yogaLayoutableShadowNode->yogaNode_.get();

    yogaNodeChildren.push_back(yogaNodeChild);

    if (yogaNodeChild->getOwner() == nullptr) {
      yogaLayoutableShadowNode->ensureUnsealed();
      yogaNodeChild->setOwner(&yogaNode);
    }
  }

  yogaNode.setChildren(yogaNodeChildren);
}

} // namespace react
} // namespace facebook
