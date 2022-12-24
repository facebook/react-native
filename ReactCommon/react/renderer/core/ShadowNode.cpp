/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNode.h"
#include "DynamicPropsUtilities.h"
#include "ShadowNodeFragment.h"

#include <butter/small_vector.h>

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

#include <utility>

namespace facebook::react {

ShadowNode::SharedListOfShared ShadowNode::emptySharedShadowNodeSharedList() {
  static const auto emptySharedShadowNodeSharedList =
      std::make_shared<ShadowNode::ListOfShared>();
  return emptySharedShadowNodeSharedList;
}

/*
 * On iOS, this method returns `props` if provided, `sourceShadowNode`'s props
 * otherwise. On Android, we forward props in case `sourceShadowNode` hasn't
 * been mounted. `Props::rawProps` are merged from `props` to a copy of
 * `sourceShadowNode.props_` and returned. This is necessary to enable
 * Background Executor and should be removed once reimplementation of JNI layer
 * is finished.
 */
Props::Shared ShadowNode::propsForClonedShadowNode(
    ShadowNode const &sourceShadowNode,
    Props::Shared const &props) {
#ifdef ANDROID
  bool hasBeenMounted = sourceShadowNode.hasBeenMounted_;
  bool sourceNodeHasRawProps = !sourceShadowNode.getProps()->rawProps.empty();
  if (!hasBeenMounted && sourceNodeHasRawProps && props) {
    auto &castedProps = const_cast<Props &>(*props);
    castedProps.rawProps = mergeDynamicProps(
        sourceShadowNode.getProps()->rawProps, props->rawProps);
    return props;
  }
#endif
  return props ? props : sourceShadowNode.getProps();
}

bool ShadowNode::sameFamily(const ShadowNode &first, const ShadowNode &second) {
  return first.family_ == second.family_;
}

#pragma mark - Constructors

ShadowNode::ShadowNode(
    ShadowNodeFragment const &fragment,
    ShadowNodeFamily::Shared family,
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
      orderIndex_(0),
      family_(std::move(family)),
      traits_(traits) {
  react_native_assert(props_);
  react_native_assert(children_);

  traits_.set(ShadowNodeTraits::Trait::ChildrenAreShared);

  for (auto const &child : *children_) {
    child->family_->setParent(family_);
  }

  // The first node of the family gets its state committed automatically.
  family_->setMostRecentState(state_);
}

ShadowNode::ShadowNode(
    ShadowNode const &sourceShadowNode,
    ShadowNodeFragment const &fragment)
    :
#if RN_DEBUG_STRING_CONVERTIBLE
      revision_(sourceShadowNode.revision_ + 1),
#endif
      props_(propsForClonedShadowNode(sourceShadowNode, fragment.props)),
      children_(
          fragment.children ? fragment.children : sourceShadowNode.children_),
      state_(
          fragment.state ? fragment.state
                         : sourceShadowNode.getMostRecentState()),
      orderIndex_(sourceShadowNode.orderIndex_),
      family_(sourceShadowNode.family_),
      traits_(sourceShadowNode.traits_) {

  react_native_assert(props_);
  react_native_assert(children_);

  traits_.set(ShadowNodeTraits::Trait::ChildrenAreShared);

  if (fragment.children) {
    for (const auto &child : *children_) {
      child->family_->setParent(family_);
    }
  }
}

ShadowNode::Unshared ShadowNode::clone(
    const ShadowNodeFragment &fragment) const {
  auto const &family = *family_;
  auto const &componentDescriptor = family.componentDescriptor_;
  if (family.nativeProps_DEPRECATED != nullptr) {
    auto propsParserContext = PropsParserContext{family_->getSurfaceId(), {}};
    if (fragment.props == ShadowNodeFragment::propsPlaceholder()) {
      // Clone existing `props_` with `family.nativeProps_DEPRECATED` to apply
      // previously set props via `setNativeProps` API.
      auto props = componentDescriptor.cloneProps(
          propsParserContext, props_, RawProps(*family.nativeProps_DEPRECATED));
      auto clonedNode = componentDescriptor.cloneShadowNode(
          *this,
          {
              props,
              fragment.children,
              fragment.state,
          });
      return clonedNode;
    } else {
      // TODO: We might need to merge fragment.priops with
      // `family.nativeProps_DEPRECATED`.
      return componentDescriptor.cloneShadowNode(*this, fragment);
    }
  } else {
    return componentDescriptor.cloneShadowNode(*this, fragment);
  }
}

ContextContainer::Shared ShadowNode::getContextContainer() const {
  return family_->componentDescriptor_.getContextContainer();
}

#pragma mark - Getters

ComponentName ShadowNode::getComponentName() const {
  return family_->getComponentName();
}

ComponentHandle ShadowNode::getComponentHandle() const {
  return family_->getComponentHandle();
}

const ShadowNode::ListOfShared &ShadowNode::getChildren() const {
  return *children_;
}

ShadowNodeTraits ShadowNode::getTraits() const {
  return traits_;
}

const Props::Shared &ShadowNode::getProps() const {
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

int ShadowNode::getOrderIndex() const {
  return orderIndex_;
}

void ShadowNode::sealRecursive() const {
  if (getSealed()) {
    return;
  }

  seal();

  props_->seal();

  for (auto const &child : *children_) {
    child->sealRecursive();
  }
}

#pragma mark - Mutating Methods

void ShadowNode::appendChild(const ShadowNode::Shared &child) {
  ensureUnsealed();

  cloneChildrenIfShared();
  auto nonConstChildren =
      std::const_pointer_cast<ShadowNode::ListOfShared>(children_);
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

  if (suggestedIndex != -1 && static_cast<size_t>(suggestedIndex) < size) {
    // If provided `suggestedIndex` is accurate,
    // replacing in place using the index.
    if (children.at(suggestedIndex).get() == &oldChild) {
      children[suggestedIndex] = newChild;
      return;
    }
  }

  for (size_t index = 0; index < size; index++) {
    if (children.at(index).get() == &oldChild) {
      children[index] = newChild;
      return;
    }
  }

  react_native_assert(false && "Child to replace was not found.");
}

void ShadowNode::cloneChildrenIfShared() {
  if (!traits_.check(ShadowNodeTraits::Trait::ChildrenAreShared)) {
    return;
  }

  traits_.unset(ShadowNodeTraits::Trait::ChildrenAreShared);
  children_ = std::make_shared<ShadowNode::ListOfShared>(*children_);
}

void ShadowNode::setMounted(bool mounted) const {
  if (mounted) {
    family_->setMostRecentState(getState());
    hasBeenMounted_ = mounted;
  }

  family_->eventEmitter_->setEnabled(mounted);
}

ShadowNodeFamily const &ShadowNode::getFamily() const {
  return *family_;
}

ShadowNode::Unshared ShadowNode::cloneTree(
    ShadowNodeFamily const &shadowNodeFamily,
    std::function<ShadowNode::Unshared(ShadowNode const &oldShadowNode)> const
        &callback) const {
  auto ancestors = shadowNodeFamily.getAncestors(*this);

  if (ancestors.empty()) {
    return ShadowNode::Unshared{nullptr};
  }

  auto &parent = ancestors.back();
  auto &oldShadowNode = parent.first.get().getChildren().at(parent.second);

  auto newShadowNode = callback(*oldShadowNode);

  react_native_assert(
      newShadowNode &&
      "`callback` returned `nullptr` which is not allowed value.");

  auto childNode = newShadowNode;

  for (auto it = ancestors.rbegin(); it != ancestors.rend(); ++it) {
    auto &parentNode = it->first.get();
    auto childIndex = it->second;

    auto children = parentNode.getChildren();
    react_native_assert(
        ShadowNode::sameFamily(*children.at(childIndex), *childNode));
    children[childIndex] = childNode;

    childNode = parentNode.clone({
        ShadowNodeFragment::propsPlaceholder(),
        std::make_shared<ShadowNode::ListOfShared>(children),
    });
  }

  return std::const_pointer_cast<ShadowNode>(childNode);
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
std::string ShadowNode::getDebugName() const {
  return getComponentName();
}

std::string ShadowNode::getDebugValue() const {
  return "r" + folly::to<std::string>(revision_) + "/sr" +
      folly::to<std::string>(state_ ? state_->getRevision() : 0) +
      (getSealed() ? "/sealed" : "");
}

SharedDebugStringConvertibleList ShadowNode::getDebugChildren() const {
  auto debugChildren = SharedDebugStringConvertibleList{};

  for (auto const &child : *children_) {
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

} // namespace facebook::react
