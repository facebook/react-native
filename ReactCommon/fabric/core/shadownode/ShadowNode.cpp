/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNode.h"

#include <better/small_vector.h>

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
    ShadowNodeFragment const &fragment,
    ComponentDescriptor const &componentDescriptor,
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
      family_(std::make_shared<ShadowNodeFamily const>(
          fragment.tag,
          fragment.surfaceId,
          fragment.eventEmitter,
          componentDescriptor)),
      traits_(traits) {
  assert(props_);
  assert(children_);

  traits_.set(ShadowNodeTraits::Trait::ChildrenAreShared);

  for (const auto &child : *children_) {
    child->family_->setParent(family_);
  }
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
      localData_(
          fragment.localData ? fragment.localData
                             : sourceShadowNode.localData_),
      state_(
          fragment.state ? fragment.state
                         : sourceShadowNode.getMostRecentState()),
      family_(sourceShadowNode.family_),
      traits_(sourceShadowNode.traits_) {
  // `tag`, `surfaceId`, and `eventEmitter` cannot be changed with cloning.
  assert(fragment.tag == ShadowNodeFragment::tagPlaceholder());
  assert(fragment.surfaceId == ShadowNodeFragment::surfaceIdPlaceholder());
  assert(
      fragment.eventEmitter == ShadowNodeFragment::eventEmitterPlaceholder());

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
  if (state_) {
    auto committedState = state_->getMostRecentState();

    // Committed state can be `null` in case if no one node was committed yet;
    // in this case we return own `state`.
    return committedState ? committedState : state_;
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

void ShadowNode::setLocalData(const SharedLocalData &localData) {
  ensureUnsealed();
  localData_ = localData;
}

void ShadowNode::cloneChildrenIfShared() {
  if (!traits_.check(ShadowNodeTraits::Trait::ChildrenAreShared)) {
    return;
  }

  traits_.unset(ShadowNodeTraits::Trait::ChildrenAreShared);
  children_ = std::make_shared<SharedShadowNodeList>(*children_);
}

void ShadowNode::setMounted(bool mounted) const {
  family_->eventEmitter_->setEnabled(mounted);
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
