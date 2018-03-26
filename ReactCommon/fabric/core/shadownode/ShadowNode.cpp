/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNode.h"

#include <fabric/debug/DebugStringConvertible.h>
#include <fabric/debug/DebugStringConvertibleItem.h>

namespace facebook {
namespace react {

SharedShadowNodeSharedList ShadowNode::emptySharedShadowNodeSharedList() {
  static const auto emptySharedShadowNodeSharedList = std::make_shared<SharedShadowNodeList>();
  return emptySharedShadowNodeSharedList;
}

#pragma mark - Constructors

ShadowNode::ShadowNode(
  Tag tag,
  Tag rootTag,
  InstanceHandle instanceHandle,
  SharedProps props,
  SharedShadowNodeSharedList children
):
  tag_(tag),
  rootTag_(rootTag),
  instanceHandle_(instanceHandle),
  props_(props),
  children_(children),
  revision_(1) {}

ShadowNode::ShadowNode(
  SharedShadowNode shadowNode,
  SharedProps props,
  SharedShadowNodeSharedList children
):
  tag_(shadowNode->tag_),
  rootTag_(shadowNode->rootTag_),
  instanceHandle_(shadowNode->instanceHandle_),
  props_(props ? props : shadowNode->props_),
  children_(children ? children : shadowNode->children_),
  sourceNode_(shadowNode),
  revision_(shadowNode->revision_ + 1) {}

#pragma mark - Getters

SharedShadowNodeSharedList ShadowNode::getChildren() const {
  return children_;
}

SharedProps ShadowNode::getProps() const {
  return props_;
}

Tag ShadowNode::getTag() const {
  return tag_;
}

Tag ShadowNode::getRootTag() const {
  return rootTag_;
}

InstanceHandle ShadowNode::getInstanceHandle() const {
  return instanceHandle_;
}

SharedShadowNode ShadowNode::getSourceNode() const {
  return sourceNode_.lock();
}

void ShadowNode::sealRecursive() const {
  if (getSealed()) {
    return;
  }

  seal();

  props_->seal();

  for (auto child : *children_) {
    child->sealRecursive();
  }
}

#pragma mark - Mutating Methods

void ShadowNode::appendChild(const SharedShadowNode &child) {
  ensureUnsealed();

  // We cannot mutate `children_` in place here because it is a *shared*
  // data structure which means other `ShadowNodes` might refer to its old value.
  // So, we have to clone this and only then mutate.
  auto nonConstChildrenCopy = SharedShadowNodeList(*children_);
  nonConstChildrenCopy.push_back(child);
  children_ = std::make_shared<const SharedShadowNodeList>(nonConstChildrenCopy);
}

void ShadowNode::replaceChild(const SharedShadowNode &oldChild, const SharedShadowNode &newChild) {
  ensureUnsealed();

  // We cannot mutate `children_` in place here because it is a *shared*
  // data structure which means other `ShadowNodes` might refer to its old value.
  // So, we have to clone this and only then mutate.
  auto nonConstChildrenCopy = SharedShadowNodeList(*children_);
  std::replace(nonConstChildrenCopy.begin(), nonConstChildrenCopy.end(), oldChild, newChild);
  children_ = std::make_shared<const SharedShadowNodeList>(nonConstChildrenCopy);
}

void ShadowNode::clearSourceNode() {
  ensureUnsealed();
  sourceNode_.reset();
}

#pragma mark - DebugStringConvertible

std::string ShadowNode::getDebugName() const {
  return getComponentName();
}

std::string ShadowNode::getDebugValue() const {
  return "r" + std::to_string(revision_) + (getSealed() ? "/sealed" : "");
}

SharedDebugStringConvertibleList ShadowNode::getDebugChildren() const {
  SharedDebugStringConvertibleList debugChildren = {};

  for (auto child : *children_) {
    auto debugChild = std::dynamic_pointer_cast<const DebugStringConvertible>(child);
    if (debugChild) {
      debugChildren.push_back(debugChild);
    }
  }

  return debugChildren;
}

SharedDebugStringConvertibleList ShadowNode::getDebugProps() const {
  SharedDebugStringConvertibleList list = {};

  list.push_back(std::make_shared<DebugStringConvertibleItem>("tag", std::to_string(tag_)));

  if (instanceHandle_) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>("handle", std::to_string((size_t)instanceHandle_)));
  }

  SharedShadowNode sourceNode = getSourceNode();
  if (sourceNode) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>(
      "source",
      sourceNode->getDebugDescription({.maximumDepth = 1, .format = false})
    ));
  }

  SharedDebugStringConvertibleList propsList = props_->getDebugProps();
  std::move(propsList.begin(), propsList.end(), std::back_inserter(list));
  return list;
}

} // namespace react
} // namespace facebook
