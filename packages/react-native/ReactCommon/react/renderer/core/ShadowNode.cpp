/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNode.h"
#include "DynamicPropsUtilities.h"
#include "ShadowNodeFragment.h"

#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

#include <utility>

namespace facebook::react {

/*
 * Runtime shadow node reference updates should only run from one thread at all
 * times to avoid having more than one shadow tree updating the current fiber
 * tree simultaneously. This thread_local flag allows enabling the updates for
 * choses threads.
 */
thread_local bool useRuntimeShadowNodeReferenceUpdateOnThread{false}; // NOLINT

/* static */ void ShadowNode::setUseRuntimeShadowNodeReferenceUpdateOnThread(
    bool isEnabled) {
  useRuntimeShadowNodeReferenceUpdateOnThread = isEnabled;
}

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
    const ShadowNode& sourceShadowNode,
    const Props::Shared& props) {
#ifdef ANDROID
  bool hasBeenMounted = sourceShadowNode.hasBeenMounted_;
  bool sourceNodeHasRawProps = !sourceShadowNode.getProps()->rawProps.empty();
  if (!hasBeenMounted && sourceNodeHasRawProps && props) {
    auto& castedProps = const_cast<Props&>(*props);
    castedProps.rawProps = mergeDynamicProps(
        sourceShadowNode.getProps()->rawProps,
        props->rawProps,
        NullValueStrategy::Override);
    return props;
  }
#endif
  return props ? props : sourceShadowNode.getProps();
}

bool ShadowNode::sameFamily(const ShadowNode& first, const ShadowNode& second) {
  return first.family_ == second.family_;
}

#pragma mark - Constructors

ShadowNode::ShadowNode(
    const ShadowNodeFragment& fragment,
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

  for (const auto& child : *children_) {
    child->family_->setParent(family_);
  }

  // The first node of the family gets its state committed automatically.
  family_->setMostRecentState(state_);
}

ShadowNode::ShadowNode(
    const ShadowNode& sourceShadowNode,
    const ShadowNodeFragment& fragment)
    :
#if RN_DEBUG_STRING_CONVERTIBLE
      revision_(sourceShadowNode.revision_ + 1),
#endif
      props_(propsForClonedShadowNode(sourceShadowNode, fragment.props)),
      children_(
          fragment.children ? fragment.children : sourceShadowNode.children_),
      state_(
          fragment.state ? fragment.state
                         : (ReactNativeFeatureFlags::useShadowNodeStateOnClone()
                                ? sourceShadowNode.state_
                                : sourceShadowNode.getMostRecentState())), 
      orderIndex_(sourceShadowNode.orderIndex_),
      family_(sourceShadowNode.family_),
      traits_(sourceShadowNode.traits_) {

  react_native_assert(props_);
  react_native_assert(children_);

  // State could have been progressed above by checking
  // `sourceShadowNode.getMostRecentState()`.
  traits_.set(ShadowNodeTraits::Trait::ChildrenAreShared);

  if (fragment.children) {
    for (const auto& child : *children_) {
      child->family_->setParent(family_);
    }
  }
}

ShadowNode::Unshared ShadowNode::clone(
    const ShadowNodeFragment& fragment) const {
  const auto& family = *family_;
  const auto& componentDescriptor = family.componentDescriptor_;
  if (family.nativeProps_DEPRECATED != nullptr) {
    auto propsParserContext = PropsParserContext{family_->getSurfaceId(), {}};
    if (fragment.props == ShadowNodeFragment::propsPlaceholder()) {
      // Clone existing `props_` with `family.nativeProps_DEPRECATED` to apply
      // previously set props via `setNativeProps` API.
      auto props = componentDescriptor.cloneProps(
          propsParserContext, props_, RawProps(*family.nativeProps_DEPRECATED));
      auto clonedNode = componentDescriptor.cloneShadowNode(
          *this,
          {.props = props,
           .children = fragment.children,
           .state = fragment.state});
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

const ShadowNode::ListOfShared& ShadowNode::getChildren() const {
  return *children_;
}

ShadowNodeTraits ShadowNode::getTraits() const {
  return traits_;
}

const Props::Shared& ShadowNode::getProps() const {
  return props_;
}

const SharedEventEmitter& ShadowNode::getEventEmitter() const {
  return family_->eventEmitter_;
}

jsi::Value ShadowNode::getInstanceHandle(jsi::Runtime& runtime) const {
  auto instanceHandle = family_->instanceHandle_;
  if (instanceHandle == nullptr) {
    return jsi::Value::null();
  }

  return instanceHandle->getInstanceHandle(runtime);
}

Tag ShadowNode::getTag() const {
  return family_->tag_;
}

SurfaceId ShadowNode::getSurfaceId() const {
  return family_->surfaceId_;
}

const ComponentDescriptor& ShadowNode::getComponentDescriptor() const {
  return family_->componentDescriptor_;
}

const State::Shared& ShadowNode::getState() const {
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

  for (const auto& child : *children_) {
    child->sealRecursive();
  }
}

#pragma mark - Mutating Methods

void ShadowNode::appendChild(const ShadowNode::Shared& child) {
  ensureUnsealed();

  cloneChildrenIfShared();
  auto& children = const_cast<ShadowNode::ListOfShared&>(*children_);
  children.push_back(child);

  child->family_->setParent(family_);
}

void ShadowNode::replaceChild(
    const ShadowNode& oldChild,
    const ShadowNode::Shared& newChild,
    size_t suggestedIndex) {
  ensureUnsealed();

  cloneChildrenIfShared();
  newChild->family_->setParent(family_);

  auto& children = const_cast<ShadowNode::ListOfShared&>(*children_);
  auto size = children.size();

  if (suggestedIndex != std::numeric_limits<size_t>::max() &&
      suggestedIndex < size) {
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
    family_->setMounted();
    hasBeenMounted_ = mounted;
  }

  family_->eventEmitter_->setEnabled(mounted);
}

bool ShadowNode::getHasBeenPromoted() const {
  return hasBeenMounted_.load();
}

void ShadowNode::setRuntimeShadowNodeReference(
    const std::shared_ptr<ShadowNodeWrapper>& runtimeShadowNodeReference)
    const {
  runtimeShadowNodeReference_ = runtimeShadowNodeReference;
}

void ShadowNode::updateRuntimeShadowNodeReference(
    const Shared& destinationShadowNode) const {
  if (auto reference = runtimeShadowNodeReference_.lock()) {
    reference->shadowNode = destinationShadowNode;
  }
}

void ShadowNode::transferRuntimeShadowNodeReference(
    const Shared& destinationShadowNode) const {
  destinationShadowNode->runtimeShadowNodeReference_ =
      runtimeShadowNodeReference_;

  if (!ReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommit()) {
    updateRuntimeShadowNodeReference(destinationShadowNode);
  }
}

void ShadowNode::transferRuntimeShadowNodeReference(
    const Shared& destinationShadowNode,
    const ShadowNodeFragment& fragment) const {
  if ((ReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommit() ||
       useRuntimeShadowNodeReferenceUpdateOnThread) &&
      fragment.runtimeShadowNodeReference) {
    transferRuntimeShadowNodeReference(destinationShadowNode);
  }
}

const ShadowNodeFamily& ShadowNode::getFamily() const {
  return *family_;
}

ShadowNode::Unshared ShadowNode::cloneTree(
    const ShadowNodeFamily& shadowNodeFamily,
    const std::function<ShadowNode::Unshared(const ShadowNode& oldShadowNode)>&
        callback) const {
  auto ancestors = shadowNodeFamily.getAncestors(*this);

  if (ancestors.empty()) {
    return ShadowNode::Unshared{nullptr};
  }

  auto& parent = ancestors.back();
  auto& oldShadowNode = parent.first.get().getChildren().at(parent.second);

  auto newShadowNode = callback(*oldShadowNode);

  react_native_assert(
      newShadowNode &&
      "`callback` returned `nullptr` which is not allowed value.");

  auto childNode = newShadowNode;

  for (auto it = ancestors.rbegin(); it != ancestors.rend(); ++it) {
    auto& parentNode = it->first.get();
    auto childIndex = it->second;

    auto children = parentNode.getChildren();
    react_native_assert(
        ShadowNode::sameFamily(*children.at(childIndex), *childNode));
    children[childIndex] = childNode;

    childNode = parentNode.clone(
        {.children = std::make_shared<ShadowNode::ListOfShared>(children)});
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
      (getSealed() ? "/sealed" : "") +
      (getProps()->nativeId.empty() ? "" : "/id=" + getProps()->nativeId);
}

SharedDebugStringConvertibleList ShadowNode::getDebugChildren() const {
  auto debugChildren = SharedDebugStringConvertibleList{};

  for (const auto& child : *children_) {
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

// Explicitly define destructors here, as they have to exist in order to act as
// a "key function" for the ShadowNodeWrapper class -- this allows for RTTI to
// work properly across dynamic library boundaries (i.e. dynamic_cast that is
// used by getNativeState method)
ShadowNodeWrapper::~ShadowNodeWrapper() = default;

} // namespace facebook::react
