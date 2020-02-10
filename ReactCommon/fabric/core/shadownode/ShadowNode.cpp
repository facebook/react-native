/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNode.h"
#include "ShadowNodeFragment.h"

#include <better/small_vector.h>

#include <react/core/ComponentDescriptor.h>
#include <react/core/ShadowNodeFragment.h>
#include <react/debug/DebugStringConvertible.h>
#include <react/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

SharedShadowNodeSharedList ShadowNode::emptySharedShadowNodeSharedList() {
  static const auto emptySharedShadowNodeSharedList =
      std::make_shared<SharedShadowNodeList>();
  return emptySharedShadowNodeSharedList;
}

bool ShadowNode::sameFamily(const ShadowNode &first, const ShadowNode &second) {
  return first.family_ == second.family_;
}

#pragma mark - Constructors

static int computeStateRevision(
    const State::Shared &state,
    const SharedShadowNodeSharedList &children) {
  int fragmentStateRevision = state ? state->getRevision() : 0;
  int childrenSum = 0;

  if (children) {
    for (const auto &child : *children) {
      childrenSum += child->getStateRevision();
    }
  }

  return fragmentStateRevision + childrenSum;
}

ShadowNode::ShadowNode(
    ShadowNodeFragment const &fragment,
    ShadowNodeFamily::Shared const &family,
    ShadowNodeTraits traits)
    :
#if RN_DEBUG_STRING_CONVERTIBLE
      revision_(1),
#endif
      props_(fragment.props),
      children_(
          fragment.children ? fragment.children
                            : emptySharedShadowNodeSharedList()),
      state_(fragment.state),
      stateRevision_(computeStateRevision(state_, children_)),
      family_(family),
      traits_(traits) {
  assert(props_);
  assert(children_);

  traits_.set(ShadowNodeTraits::Trait::ChildrenAreShared);

  for (auto const &child : *children_) {
    child->family_->setParent(family_);
  }

  // The first node of the family gets its state committed automatically.
  family_->setMostRecentState(state_);
}

ShadowNode::ShadowNode(
    const ShadowNode &sourceShadowNode,
    const ShadowNodeFragment &fragment)
    :
#if RN_DEBUG_STRING_CONVERTIBLE
      revision_(sourceShadowNode.revision_ + 1),
#endif
      props_(fragment.props ? fragment.props : sourceShadowNode.props_),
      children_(
          fragment.children ? fragment.children : sourceShadowNode.children_),
      state_(
          fragment.state ? fragment.state
                         : sourceShadowNode.getMostRecentState()),
      stateRevision_(computeStateRevision(state_, children_)),
      family_(sourceShadowNode.family_),
      traits_(sourceShadowNode.traits_) {

  assert(props_);
  assert(children_);

  traits_.set(ShadowNodeTraits::Trait::ChildrenAreShared);

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

ComponentName ShadowNode::getComponentName() const {
  return family_->getComponentName();
}

ComponentHandle ShadowNode::getComponentHandle() const {
  return family_->getComponentHandle();
}

const SharedShadowNodeList &ShadowNode::getChildren() const {
  return *children_;
}

ShadowNodeTraits ShadowNode::getTraits() const {
  return traits_;
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
  return family_->getMostRecentState();
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

void ShadowNode::appendChild(const ShadowNode::Shared &child) {
  ensureUnsealed();

  cloneChildrenIfShared();
  auto nonConstChildren =
      std::const_pointer_cast<SharedShadowNodeList>(children_);
  nonConstChildren->push_back(child);

  child->family_->setParent(family_);
}

void ShadowNode::replaceChild(
    ShadowNode const &oldChild,
    ShadowNode::Shared const &newChild,
    int suggestedIndex) {
  ensureUnsealed();

  cloneChildrenIfShared();

  newChild->family_->setParent(family_);

  auto &children =
      *std::const_pointer_cast<ShadowNode::ListOfShared>(children_);
  auto size = children.size();

  if (suggestedIndex != -1 && suggestedIndex < size) {
    // If provided `suggestedIndex` is accurate,
    // replacing in place using the index.
    if (children.at(suggestedIndex).get() == &oldChild) {
      children[suggestedIndex] = newChild;
      return;
    }
  }

  for (auto index = 0; index < size; index++) {
    if (children.at(index).get() == &oldChild) {
      children[index] = newChild;
      return;
    }
  }

  assert(false && "Child to replace was not found.");
}

void ShadowNode::cloneChildrenIfShared() {
  if (!traits_.check(ShadowNodeTraits::Trait::ChildrenAreShared)) {
    return;
  }

  traits_.unset(ShadowNodeTraits::Trait::ChildrenAreShared);
  children_ = std::make_shared<SharedShadowNodeList>(*children_);
}

void ShadowNode::setMounted(bool mounted) const {
  if (mounted) {
    family_->setMostRecentState(getState());
  }

  family_->eventEmitter_->setEnabled(mounted);
}

ShadowNodeFamily const &ShadowNode::getFamily() const {
  return *family_;
}

int ShadowNode::getStateRevision() const {
  return stateRevision_;
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
std::string ShadowNode::getDebugName() const {
  return getComponentName();
}

std::string ShadowNode::getDebugValue() const {
  return "r" + folly::to<std::string>(revision_) + "/sr" +
      folly::to<std::string>(stateRevision_) + "/s" +
      folly::to<std::string>(state_ ? state_->getRevision() : 0) +
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
