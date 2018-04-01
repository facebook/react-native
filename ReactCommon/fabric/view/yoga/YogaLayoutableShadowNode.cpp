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
#include <fabric/debug/DebugStringConvertibleItem.h>

#include "yogaValuesConversions.h"

namespace facebook {
namespace react {

SharedYogaConfig YogaLayoutableShadowNode::suitableYogaConfig() {
  static SharedYogaConfig sharedYogaConfig;

  if (!sharedYogaConfig) {
    sharedYogaConfig = std::make_shared<YGConfig>(YGConfig({
      .cloneNodeCallback = YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector
    }));
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
  yogaNode->markDirtyAndPropogate();
  YogaLayoutableShadowNode::setYogaNodeChildrenBasedOnShadowNodeChildren(*yogaNode, children);
  yogaNode_ = yogaNode;
}

YogaLayoutableShadowNode::YogaLayoutableShadowNode(
  const SharedYogaLayoutableShadowNode &shadowNode,
  const SharedYogaStylableProps &props,
  const SharedShadowNodeSharedList &children
) {
  auto yogaNode = std::make_shared<YGNode>(*shadowNode->yogaNode_);
  yogaNode->setContext(this);
  yogaNode->setParent(nullptr);

  if (props) {
    yogaNode->setStyle(props->getYogaStyle());
  }

  if (children) {
    YogaLayoutableShadowNode::setYogaNodeChildrenBasedOnShadowNodeChildren(*yogaNode, children);
  }

  yogaNode->markDirtyAndPropogate();

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

void YogaLayoutableShadowNode::appendChild(SharedYogaLayoutableShadowNode child) {
  ensureUnsealed();

  auto nonConstYogaNode = std::const_pointer_cast<YGNode>(yogaNode_);
  auto nonConstChildYogaNode = std::const_pointer_cast<YGNode>(child->yogaNode_);
  nonConstYogaNode->insertChild(nonConstChildYogaNode.get(), nonConstYogaNode->getChildrenCount());
}

void YogaLayoutableShadowNode::layout(LayoutContext layoutContext) {
  ensureUnsealed();

  if (!getIsLayoutClean()) {
    YGNode *yogaNode = const_cast<YGNode *>(yogaNode_.get());
    YGNodeCalculateLayout(yogaNode, YGUndefined, YGUndefined, YGDirectionInherit);
  }

  LayoutableShadowNode::layout(layoutContext);
}

void YogaLayoutableShadowNode::layoutChildren(LayoutContext layoutContext) {
  ensureUnsealed();

  for (auto child : getChildren()) {
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

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList YogaLayoutableShadowNode::getDebugProps() const {
  // TODO: Move to the base class and return `layoutMetrics` instead.

  SharedDebugStringConvertibleList list = {};

  if (getHasNewLayout()) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>("hasNewLayout"));
  }

  YGLayout defaultYogaLayout = YGLayout();
  defaultYogaLayout.direction = YGDirectionLTR;
  YGLayout currentYogaLayout = std::const_pointer_cast<YGNode>(yogaNode_)->getLayout();

#define YOGA_LAYOUT_PROPS_ADD_TO_SET(stringName, propertyName, accessor, convertor) \
  { \
    auto currentValueString = convertor(currentYogaLayout.propertyName accessor); \
    auto defaultValueString = convertor(defaultYogaLayout.propertyName accessor); \
    if (currentValueString != defaultValueString) { \
      list.push_back(std::make_shared<DebugStringConvertibleItem>(#stringName, currentValueString)); \
    } \
  }

  YOGA_LAYOUT_PROPS_ADD_TO_SET(position, position, , stringFromYogaPosition)
  YOGA_LAYOUT_PROPS_ADD_TO_SET(dimensions, dimensions, , stringFromYogaDimensions)
  YOGA_LAYOUT_PROPS_ADD_TO_SET(margin, margin, , stringFromYogaEdges)
  YOGA_LAYOUT_PROPS_ADD_TO_SET(border, border, , stringFromYogaEdges)
  YOGA_LAYOUT_PROPS_ADD_TO_SET(padding, padding, , stringFromYogaEdges)
  YOGA_LAYOUT_PROPS_ADD_TO_SET(direction, direction, , stringFromYogaStyleDirection)

  return list;
}

#pragma mark - Helpers

#pragma mark - Yoga Connectors

void YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector(YGNode *oldYogaNode, YGNode *newYogaNode, YGNode *parentYogaNode, int childIndex) {
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
  for (auto child : parentShadowNodeRawPtr->getChildren()) {
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

  // And finally, we have to replace underline yoga node with the new one provided by Yoga.
  newYogaNode->setContext((void *)newShadowNode.get());
  newShadowNode->yogaNode_ = std::shared_ptr<YGNode>(newYogaNode);
}

void YogaLayoutableShadowNode::setYogaNodeChildrenBasedOnShadowNodeChildren(YGNode &yogaNode, const SharedShadowNodeSharedList &children) {
  auto yogaNodeChildren = YGVector();

  for (const SharedShadowNode &shadowNode : *children) {
    const SharedYogaLayoutableShadowNode yogaLayoutableShadowNode = std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(shadowNode);

    if (!yogaLayoutableShadowNode) {
      continue;
    }

    yogaNodeChildren.push_back((YGNode *)yogaLayoutableShadowNode->yogaNode_.get());
  }

  yogaNode.setChildren(yogaNodeChildren);
  yogaNode.markDirtyAndPropogate();
}

} // namespace react
} // namespace facebook
