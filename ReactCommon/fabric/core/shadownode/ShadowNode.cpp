/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNode.h"

#include <string>

#include <fabric/debug/DebugStringConvertible.h>
#include <fabric/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

SharedShadowNodeSharedList ShadowNode::emptySharedShadowNodeSharedList() {
  static const auto emptySharedShadowNodeSharedList = std::make_shared<SharedShadowNodeList>();
  return emptySharedShadowNodeSharedList;
}

#pragma mark - Constructors

ShadowNode::ShadowNode(
  const Tag &tag,
  const Tag &rootTag,
  const SharedProps &props,
  const SharedEventEmitter &eventEmitter,
  const SharedShadowNodeSharedList &children,
  const ShadowNodeCloneFunction &cloneFunction
):
  tag_(tag),
  rootTag_(rootTag),
  props_(props),
  eventEmitter_(eventEmitter),
  children_(std::make_shared<SharedShadowNodeList>(*children)),
  cloneFunction_(cloneFunction),
  revision_(1) {}

ShadowNode::ShadowNode(
  const SharedShadowNode &shadowNode,
  const SharedProps &props,
  const SharedEventEmitter &eventEmitter,
  const SharedShadowNodeSharedList &children
):
  tag_(shadowNode->tag_),
  rootTag_(shadowNode->rootTag_),
  props_(props ? props : shadowNode->props_),
  eventEmitter_(eventEmitter ? eventEmitter : shadowNode->eventEmitter_),
  children_(std::make_shared<SharedShadowNodeList>(*(children ? children : shadowNode->children_))),
  localData_(shadowNode->localData_),
  cloneFunction_(shadowNode->cloneFunction_),
  revision_(shadowNode->revision_ + 1) {}

UnsharedShadowNode ShadowNode::clone(
  const SharedProps &props,
  const SharedShadowNodeSharedList &children
) const {
  assert(cloneFunction_);
  return cloneFunction_(shared_from_this(), props_, eventEmitter_, children_);
}

#pragma mark - Getters

SharedShadowNodeSharedList ShadowNode::getChildren() const {
  return children_;
}

SharedProps ShadowNode::getProps() const {
  return props_;
}

SharedEventEmitter ShadowNode::getEventEmitter() const {
  return eventEmitter_;
}

Tag ShadowNode::getTag() const {
  return tag_;
}

Tag ShadowNode::getRootTag() const {
  return rootTag_;
}

SharedLocalData ShadowNode::getLocalData() const {
  return localData_;
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

  auto nonConstChildren = std::const_pointer_cast<SharedShadowNodeList>(children_);
  nonConstChildren->push_back(child);
}

void ShadowNode::replaceChild(const SharedShadowNode &oldChild, const SharedShadowNode &newChild) {
  ensureUnsealed();

  auto nonConstChildren = std::const_pointer_cast<SharedShadowNodeList>(children_);
  std::replace(nonConstChildren->begin(), nonConstChildren->end(), oldChild, newChild);
}

void ShadowNode::setLocalData(const SharedLocalData &localData) {
  ensureUnsealed();
  localData_ = localData;
}

#pragma mark - Equality

bool ShadowNode::operator==(const ShadowNode& rhs) const {
  // Note: Child nodes are not considered as part of instance's value
  // and/or identity.
  return
    tag_ == rhs.tag_ &&
    rootTag_ == rhs.rootTag_ &&
    props_ == rhs.props_ &&
    eventEmitter_ == rhs.eventEmitter_ &&
    localData_ == rhs.localData_;
}

bool ShadowNode::operator!=(const ShadowNode& rhs) const {
  return !(*this == rhs);
}

#pragma mark - DebugStringConvertible

std::string ShadowNode::getDebugName() const {
  return getComponentName();
}

std::string ShadowNode::getDebugValue() const {
  return "r" + folly::to<std::string>(revision_) + (getSealed() ? "/sealed" : "");
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
  return
    props_->getDebugProps() +
    SharedDebugStringConvertibleList {
      debugStringConvertibleItem("tag", folly::to<std::string>(tag_))
    };
}

} // namespace react
} // namespace facebook
