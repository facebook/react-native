/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNode.h"

#include <better/small_vector.h>
#include <string>

#include <react/core/ComponentDescriptor.h>
#include <react/core/ShadowNodeFragment.h>
#include <react/debug/DebugStringConvertible.h>
#include <react/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

using AncestorList = ShadowNode::AncestorList;

SharedShadowNodeSharedList ShadowNode::emptySharedShadowNodeSharedList() {
  static const auto emptySharedShadowNodeSharedList =
      std::make_shared<SharedShadowNodeList>();
  return emptySharedShadowNodeSharedList;
}

bool ShadowNode::sameFamily(const ShadowNode &first, const ShadowNode &second) {
  return first.family_ == second.family_;
}

#pragma mark - Constructors

ShadowNode::ShadowNode(
    const ShadowNodeFragment &fragment,
    const ComponentDescriptor &componentDescriptor)
    : props_(fragment.props),
      children_(
          fragment.children ? fragment.children
                            : emptySharedShadowNodeSharedList()),
      state_(fragment.state),
      family_(std::make_shared<ShadowNodeFamily const>(
          fragment.tag,
          fragment.surfaceId,
          fragment.eventEmitter,
          componentDescriptor)),
      childrenAreShared_(true),
      revision_(1) {
  assert(props_);
  assert(children_);

  for (const auto &child : *children_) {
    child->family_->setParent(family_);
  }
}

ShadowNode::ShadowNode(
    const ShadowNode &sourceShadowNode,
    const ShadowNodeFragment &fragment)
    : props_(fragment.props ? fragment.props : sourceShadowNode.props_),
      children_(
          fragment.children ? fragment.children : sourceShadowNode.children_),
      localData_(
          fragment.localData ? fragment.localData
                             : sourceShadowNode.localData_),
      state_(
          fragment.state ? fragment.state
                         : sourceShadowNode.getMostRecentState()),
      family_(sourceShadowNode.family_),
      childrenAreShared_(true),
      revision_(sourceShadowNode.revision_ + 1) {
  // `tag`, `surfaceId`, and `eventEmitter` cannot be changed with cloning.
  assert(fragment.tag == ShadowNodeFragment::tagPlaceholder());
  assert(fragment.surfaceId == ShadowNodeFragment::surfaceIdPlaceholder());
  assert(
      fragment.eventEmitter == ShadowNodeFragment::eventEmitterPlaceholder());

  assert(props_);
  assert(children_);

  if (fragment.children) {
    for (const auto &child : *children_) {
      child->family_->setParent(family_);
    }
  }
}

UnsharedShadowNode ShadowNode::clone(const ShadowNodeFragment &fragment) const {
  return family_->componentDescriptor_.cloneShadowNode(*this, fragment);
}

#pragma mark - Getters

const SharedShadowNodeList &ShadowNode::getChildren() const {
  return *children_;
}

const SharedProps &ShadowNode::getProps() const {
  return props_;
}

const SharedEventEmitter &ShadowNode::getEventEmitter() const {
  return family_->eventEmitter_;
}

Tag ShadowNode::getTag() const {
  return family_->tag_;
}

SurfaceId ShadowNode::getSurfaceId() const {
  return family_->surfaceId_;
}

const ComponentDescriptor &ShadowNode::getComponentDescriptor() const {
  return family_->componentDescriptor_;
}

const State::Shared &ShadowNode::getState() const {
  return state_;
}

State::Shared ShadowNode::getMostRecentState() const {
  if (state_) {
    auto commitedState = state_->getCommitedState();

    // Commited state can be `null` in case if no one node was commited yet;
    // in this case we return own `state`.
    return commitedState ? commitedState : state_;
  }

  return ShadowNodeFragment::statePlaceholder();
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

  cloneChildrenIfShared();
  auto nonConstChildren =
      std::const_pointer_cast<SharedShadowNodeList>(children_);
  nonConstChildren->push_back(child);

  child->family_->setParent(family_);
}

void ShadowNode::replaceChild(
    const SharedShadowNode &oldChild,
    const SharedShadowNode &newChild,
    int suggestedIndex) {
  ensureUnsealed();

  cloneChildrenIfShared();

  auto nonConstChildren =
      std::const_pointer_cast<SharedShadowNodeList>(children_);

  if (suggestedIndex != -1 && suggestedIndex < nonConstChildren->size()) {
    if (nonConstChildren->at(suggestedIndex) == oldChild) {
      (*nonConstChildren)[suggestedIndex] = newChild;
      return;
    }
  }

  std::replace(
      nonConstChildren->begin(), nonConstChildren->end(), oldChild, newChild);

  newChild->family_->setParent(family_);
}

void ShadowNode::setLocalData(const SharedLocalData &localData) {
  ensureUnsealed();
  localData_ = localData;
}

void ShadowNode::cloneChildrenIfShared() {
  if (!childrenAreShared_) {
    return;
  }
  childrenAreShared_ = false;
  children_ = std::make_shared<SharedShadowNodeList>(*children_);
}

void ShadowNode::setMounted(bool mounted) const {
  family_->eventEmitter_->setEnabled(mounted);
  if (mounted && state_) {
    state_->commit(*this);
  }
}

AncestorList ShadowNode::getAncestors(
    ShadowNode const &ancestorShadowNode) const {
  auto ancestors = AncestorList{};
  auto families = better::small_vector<ShadowNodeFamily const *, 64>{};
  auto ancestorFamily = ancestorShadowNode.family_.get();
  auto descendantFamily = family_.get();

  auto family = descendantFamily;
  while (family && family != ancestorFamily) {
    families.push_back(family);
    family = family->parent_.lock().get();
  }

  if (family != ancestorFamily) {
    ancestors.clear();
    return ancestors;
  }

  auto parentNode = &ancestorShadowNode;
  for (auto it = families.rbegin(); it != families.rend(); it++) {
    auto childFamily = *it;
    auto found = bool{false};
    auto childIndex = int{0};
    for (const auto &childNode : *parentNode->children_) {
      if (childNode->family_.get() == childFamily) {
        ancestors.push_back({*parentNode, childIndex});
        parentNode = childNode.get();
        found = true;
        break;
      }
      childIndex++;
    }

    if (!found) {
      ancestors.clear();
      return ancestors;
    }
  }

  return ancestors;
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
std::string ShadowNode::getDebugName() const {
  return getComponentName();
}

std::string ShadowNode::getDebugValue() const {
  return "r" + folly::to<std::string>(revision_) +
      (getSealed() ? "/sealed" : "");
}

SharedDebugStringConvertibleList ShadowNode::getDebugChildren() const {
  auto debugChildren = SharedDebugStringConvertibleList{};

  for (auto child : *children_) {
    auto debugChild =
        std::dynamic_pointer_cast<const DebugStringConvertible>(child);
    if (debugChild) {
      debugChildren.push_back(debugChild);
    }
  }

  return debugChildren;
}

SharedDebugStringConvertibleList ShadowNode::getDebugProps() const {
  return props_->getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem("tag", folly::to<std::string>(getTag()))};
}
#endif

} // namespace react
} // namespace facebook
