/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UIManager.h"

#include <cxxreact/JSExecutor.h>
#include <cxxreact/SystraceSection.h>
#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/core/DynamicPropsUtilities.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/uimanager/SurfaceRegistryBinding.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include <react/renderer/uimanager/UIManagerMountHook.h>

#include <glog/logging.h>

#include <utility>

namespace {
std::unique_ptr<facebook::react::LeakChecker> constructLeakCheckerIfNeeded(
    const facebook::react::RuntimeExecutor& runtimeExecutor) {
#ifdef REACT_NATIVE_DEBUG
  return std::make_unique<facebook::react::LeakChecker>(runtimeExecutor);
#else
  return {};
#endif
}
} // namespace

namespace facebook::react {

// Explicitly define destructors here, as they have to exist in order to act as
// a "key function" for the ShadowNodeWrapper class -- this allows for RTTI to
// work properly across dynamic library boundaries (i.e. dynamic_cast that is
// used by getNativeState method)
ShadowNodeListWrapper::~ShadowNodeListWrapper() = default;

UIManager::UIManager(
    const RuntimeExecutor& runtimeExecutor,
    ContextContainer::Shared contextContainer)
    : runtimeExecutor_(runtimeExecutor),
      shadowTreeRegistry_(),
      contextContainer_(std::move(contextContainer)),
      leakChecker_(constructLeakCheckerIfNeeded(runtimeExecutor)),
      lazyShadowTreeRevisionConsistencyManager_(
          ReactNativeFeatureFlags::enableUIConsistency()
              ? std::make_unique<LazyShadowTreeRevisionConsistencyManager>(
                    shadowTreeRegistry_)
              : nullptr),
      latestShadowTreeRevisionProvider_(
          ReactNativeFeatureFlags::enableUIConsistency()
              ? nullptr
              : std::make_unique<LatestShadowTreeRevisionProvider>(
                    shadowTreeRegistry_)) {}

UIManager::~UIManager() {
  LOG(WARNING) << "UIManager::~UIManager() was called (address: " << this
               << ").";
}

std::shared_ptr<ShadowNode> UIManager::createNode(
    Tag tag,
    const std::string& name,
    SurfaceId surfaceId,
    RawProps rawProps,
    InstanceHandle::Shared instanceHandle) const {
  SystraceSection s("UIManager::createNode", "componentName", name);

  auto& componentDescriptor = componentDescriptorRegistry_->at(name);
  auto fallbackDescriptor =
      componentDescriptorRegistry_->getFallbackComponentDescriptor();

  PropsParserContext propsParserContext{surfaceId, *contextContainer_.get()};

  auto family = componentDescriptor.createFamily(
      {tag, surfaceId, std::move(instanceHandle)});
  const auto props = componentDescriptor.cloneProps(
      propsParserContext, nullptr, std::move(rawProps));
  const auto state = componentDescriptor.createInitialState(props, family);

  auto shadowNode = componentDescriptor.createShadowNode(
      ShadowNodeFragment{
          .props = fallbackDescriptor != nullptr &&
                  fallbackDescriptor->getComponentHandle() ==
                      componentDescriptor.getComponentHandle()
              ? componentDescriptor.cloneProps(
                    propsParserContext,
                    props,
                    RawProps(folly::dynamic::object("name", name)))
              : props,
          .children = ShadowNodeFragment::childrenPlaceholder(),
          .state = state,
      },
      family);

  if (delegate_ != nullptr) {
    delegate_->uiManagerDidCreateShadowNode(*shadowNode);
  }
  if (leakChecker_) {
    leakChecker_->uiManagerDidCreateShadowNodeFamily(family);
  }

  return shadowNode;
}

std::shared_ptr<ShadowNode> UIManager::cloneNode(
    const ShadowNode& shadowNode,
    const ShadowNode::SharedListOfShared& children,
    RawProps rawProps) const {
  SystraceSection s(
      "UIManager::cloneNode", "componentName", shadowNode.getComponentName());

  PropsParserContext propsParserContext{
      shadowNode.getFamily().getSurfaceId(), *contextContainer_.get()};

  auto& componentDescriptor = shadowNode.getComponentDescriptor();
  auto& family = shadowNode.getFamily();
  auto props = ShadowNodeFragment::propsPlaceholder();

  if (!rawProps.isEmpty()) {
    if (family.nativeProps_DEPRECATED != nullptr) {
      // 1. update the nativeProps_DEPRECATED props.
      //
      // In this step, we want the most recent value for the props
      // managed by setNativeProps.
      // Values in `rawProps` patch (take precedence over)
      // `nativeProps_DEPRECATED`. For example, if both
      // `nativeProps_DEPRECATED` and `rawProps` contain key 'A'.
      // Value from `rawProps` overrides what was previously in
      // `nativeProps_DEPRECATED`. Notice that the `nativeProps_DEPRECATED`
      // patch will not get more props from `rawProps`: if the key is not
      // present in `nativeProps_DEPRECATED`, it will not be added.
      //
      // The result of this operation is the new `nativeProps_DEPRECATED`.
      family.nativeProps_DEPRECATED =
          std::make_unique<folly::dynamic>(mergeDynamicProps(
              *family.nativeProps_DEPRECATED, // source
              (folly::dynamic)rawProps, // patch
              NullValueStrategy::Ignore));

      // 2. Compute the final set of props.
      //
      // This step takes the new props handled by `setNativeProps` and
      // merges them in the `rawProps` managed by React.
      // The new props handled by `nativeProps` now takes precedence
      // on the props handled by React, as we want to make sure that
      // all the props are applied to the component.
      // We use these finalProps as source of truth for the component.
      auto finalProps = mergeDynamicProps(
          (folly::dynamic)rawProps, // source
          *family.nativeProps_DEPRECATED, // patch
          NullValueStrategy::Override);

      // 3. Clone the props by using finalProps.
      props = componentDescriptor.cloneProps(
          propsParserContext, shadowNode.getProps(), RawProps(finalProps));
    } else {
      props = componentDescriptor.cloneProps(
          propsParserContext, shadowNode.getProps(), std::move(rawProps));
    }
  }

  auto clonedShadowNode = componentDescriptor.cloneShadowNode(
      shadowNode,
      {
          .props = props,
          .children = children,
          .runtimeShadowNodeReference = false,
      });

  return clonedShadowNode;
}

void UIManager::appendChild(
    const ShadowNode::Shared& parentShadowNode,
    const ShadowNode::Shared& childShadowNode) const {
  SystraceSection s("UIManager::appendChild");

  auto& componentDescriptor = parentShadowNode->getComponentDescriptor();
  componentDescriptor.appendChild(parentShadowNode, childShadowNode);
}

void UIManager::completeSurface(
    SurfaceId surfaceId,
    const ShadowNode::UnsharedListOfShared& rootChildren,
    ShadowTree::CommitOptions commitOptions) {
  SystraceSection s("UIManager::completeSurface", "surfaceId", surfaceId);

  shadowTreeRegistry_.visit(surfaceId, [&](const ShadowTree& shadowTree) {
    auto result = shadowTree.commit(
        [&](const RootShadowNode& oldRootShadowNode) {
          return std::make_shared<RootShadowNode>(
              oldRootShadowNode,
              ShadowNodeFragment{
                  .props = ShadowNodeFragment::propsPlaceholder(),
                  .children = rootChildren,
              });
        },
        commitOptions);

    if (result == ShadowTree::CommitStatus::Succeeded &&
        lazyShadowTreeRevisionConsistencyManager_ != nullptr) {
      // It's safe to update the visible revision of the shadow tree immediately
      // after we commit a specific one.
      lazyShadowTreeRevisionConsistencyManager_->updateCurrentRevision(
          surfaceId, shadowTree.getCurrentRevision().rootShadowNode);
    }
  });
}

void UIManager::setIsJSResponder(
    const ShadowNode::Shared& shadowNode,
    bool isJSResponder,
    bool blockNativeResponder) const {
  if (delegate_ != nullptr) {
    delegate_->uiManagerDidSetIsJSResponder(
        shadowNode, isJSResponder, blockNativeResponder);
  }
}

void UIManager::startSurface(
    ShadowTree::Unique&& shadowTree,
    const std::string& moduleName,
    const folly::dynamic& props,
    DisplayMode displayMode) const {
  SystraceSection s("UIManager::startSurface");

  auto surfaceId = shadowTree->getSurfaceId();
  shadowTreeRegistry_.add(std::move(shadowTree));

  runtimeExecutor_([=](jsi::Runtime& runtime) {
    SystraceSection s("UIManager::startSurface::onRuntime");
    SurfaceRegistryBinding::startSurface(
        runtime, surfaceId, moduleName, props, displayMode);
  });
}

void UIManager::setSurfaceProps(
    SurfaceId surfaceId,
    const std::string& moduleName,
    const folly::dynamic& props,
    DisplayMode displayMode) const {
  SystraceSection s("UIManager::setSurfaceProps");

  runtimeExecutor_([=](jsi::Runtime& runtime) {
    SurfaceRegistryBinding::setSurfaceProps(
        runtime, surfaceId, moduleName, props, displayMode);
  });
}

ShadowTree::Unique UIManager::stopSurface(SurfaceId surfaceId) const {
  SystraceSection s("UIManager::stopSurface");

  // Stop any ongoing animations.
  stopSurfaceForAnimationDelegate(surfaceId);

  // Waiting for all concurrent commits to be finished and unregistering the
  // `ShadowTree`.
  auto shadowTree = getShadowTreeRegistry().remove(surfaceId);
  if (shadowTree) {
    // We execute JavaScript/React part of the process at the very end to
    // minimize any visible side-effects of stopping the Surface. Any possible
    // commits from the JavaScript side will not be able to reference a
    // `ShadowTree` and will fail silently.
    runtimeExecutor_([=](jsi::Runtime& runtime) {
      SurfaceRegistryBinding::stopSurface(runtime, surfaceId);
    });

    if (leakChecker_) {
      leakChecker_->stopSurface(surfaceId);
    }
  }
  return shadowTree;
}

ShadowNode::Shared UIManager::getNewestCloneOfShadowNode(
    const ShadowNode& shadowNode) const {
  auto ancestorShadowNode = ShadowNode::Shared{};
  shadowTreeRegistry_.visit(
      shadowNode.getSurfaceId(), [&](const ShadowTree& shadowTree) {
        ancestorShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
      });
  return getShadowNodeInSubtree(shadowNode, ancestorShadowNode);
}

ShadowNode::Shared UIManager::getShadowNodeInSubtree(
    const ShadowNode& shadowNode,
    const ShadowNode::Shared& ancestorShadowNode) const {
  if (!ancestorShadowNode) {
    return nullptr;
  }

  // If the given shadow node is of the same family as the root shadow node,
  // return the latest root shadow node
  if (ShadowNode::sameFamily(*ancestorShadowNode, shadowNode)) {
    return ancestorShadowNode;
  }

  auto ancestors = shadowNode.getFamily().getAncestors(*ancestorShadowNode);

  if (ancestors.empty()) {
    return nullptr;
  }

  auto pair = ancestors.rbegin();
  return pair->first.get().getChildren().at(pair->second);
}

ShadowTreeRevisionConsistencyManager*
UIManager::getShadowTreeRevisionConsistencyManager() {
  return lazyShadowTreeRevisionConsistencyManager_.get();
}

ShadowTreeRevisionProvider* UIManager::getShadowTreeRevisionProvider() {
  if (lazyShadowTreeRevisionConsistencyManager_ != nullptr) {
    return lazyShadowTreeRevisionConsistencyManager_.get();
  } else if (latestShadowTreeRevisionProvider_ != nullptr) {
    return latestShadowTreeRevisionProvider_.get();
  }

  LOG(ERROR) << "Unexpected state found in UIManager where both "
             << "lazyShadowTreeRevisionConsistencyManager_ and "
             << "latestShadowTreeRevisionProvider_ were null";
  return nullptr;
}

ShadowNode::Shared UIManager::findNodeAtPoint(
    const ShadowNode::Shared& node,
    Point point) const {
  return LayoutableShadowNode::findNodeAtPoint(
      getNewestCloneOfShadowNode(*node), point);
}

LayoutMetrics UIManager::getRelativeLayoutMetrics(
    const ShadowNode& shadowNode,
    const ShadowNode* ancestorShadowNode,
    LayoutableShadowNode::LayoutInspectingPolicy policy) const {
  SystraceSection s("UIManager::getRelativeLayoutMetrics");

  // We might store here an owning pointer to `ancestorShadowNode` to ensure
  // that the node is not deallocated during method execution lifetime.
  auto owningAncestorShadowNode = ShadowNode::Shared{};

  if (ancestorShadowNode == nullptr) {
    shadowTreeRegistry_.visit(
        shadowNode.getSurfaceId(), [&](const ShadowTree& shadowTree) {
          owningAncestorShadowNode =
              shadowTree.getCurrentRevision().rootShadowNode;
          ancestorShadowNode = owningAncestorShadowNode.get();
        });
  } else {
    // It is possible for JavaScript (or other callers) to have a reference
    // to a previous version of ShadowNodes, but we enforce that
    // metrics are only calculated on most recently committed versions.
    owningAncestorShadowNode = getNewestCloneOfShadowNode(*ancestorShadowNode);
    ancestorShadowNode = owningAncestorShadowNode.get();
  }

  auto layoutableAncestorShadowNode =
      dynamic_cast<const LayoutableShadowNode*>(ancestorShadowNode);

  if (layoutableAncestorShadowNode == nullptr) {
    return EmptyLayoutMetrics;
  }

  return LayoutableShadowNode::computeRelativeLayoutMetrics(
      shadowNode.getFamily(), *layoutableAncestorShadowNode, policy);
}

void UIManager::updateState(const StateUpdate& stateUpdate) const {
  SystraceSection s(
      "UIManager::updateState",
      "componentName",
      stateUpdate.family->getComponentName());
  auto& callback = stateUpdate.callback;
  auto& family = stateUpdate.family;
  auto& componentDescriptor = family->getComponentDescriptor();
  auto clonedByNativeStateTraits = ShadowNodeTraits();
  clonedByNativeStateTraits.set(
      ShadowNodeTraits::Trait::ClonedByNativeStateUpdate);

  shadowTreeRegistry_.visit(
      family->getSurfaceId(), [&](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& oldRootShadowNode) {
              auto isValid = true;

              auto rootNode = oldRootShadowNode.cloneTree(
                  *family,
                  [&](const ShadowNode& oldShadowNode) {
                    auto newData =
                        callback(oldShadowNode.getState()->getDataPointer());

                    if (!newData) {
                      isValid = false;
                      // Just return something, we will discard it anyway.
                      return oldShadowNode.clone({});
                    }

                    auto newState =
                        componentDescriptor.createState(*family, newData);

                    return oldShadowNode.clone(
                        {.props = ShadowNodeFragment::propsPlaceholder(),
                         .children = ShadowNodeFragment::childrenPlaceholder(),
                         .state = newState,
                         .traits = clonedByNativeStateTraits});
                  },
                  clonedByNativeStateTraits);

              return isValid
                  ? std::static_pointer_cast<RootShadowNode>(rootNode)
                  : nullptr;
            },
            {/* default commit options */});
      });
}

void UIManager::dispatchCommand(
    const ShadowNode::Shared& shadowNode,
    const std::string& commandName,
    const folly::dynamic& args) const {
  if (delegate_ != nullptr) {
    delegate_->uiManagerDidDispatchCommand(shadowNode, commandName, args);
  }
}

void UIManager::setNativeProps_DEPRECATED(
    const ShadowNode::Shared& shadowNode,
    RawProps rawProps) const {
  auto& family = shadowNode->getFamily();
  if (family.nativeProps_DEPRECATED) {
    // Values in `rawProps` patch (take precedence over)
    // `nativeProps_DEPRECATED`. For example, if both `nativeProps_DEPRECATED`
    // and `rawProps` contain key 'A'. Value from `rawProps` overrides what was
    // previously in `nativeProps_DEPRECATED`.
    family.nativeProps_DEPRECATED =
        std::make_unique<folly::dynamic>(mergeDynamicProps(
            *family.nativeProps_DEPRECATED,
            (folly::dynamic)rawProps,
            NullValueStrategy::Override));
  } else {
    family.nativeProps_DEPRECATED =
        std::make_unique<folly::dynamic>((folly::dynamic)rawProps);
  }

  shadowTreeRegistry_.visit(
      family.getSurfaceId(), [&](const ShadowTree& shadowTree) {
        // The lambda passed to `commit` may be executed multiple times.
        // We need to create fresh copy of the `RawProps` object each time.
        auto ancestorShadowNode =
            shadowTree.getCurrentRevision().rootShadowNode;
        shadowTree.commit(
            [&](const RootShadowNode& oldRootShadowNode) {
              auto rootNode = oldRootShadowNode.cloneTree(
                  family, [&](const ShadowNode& oldShadowNode) {
                    auto& componentDescriptor =
                        componentDescriptorRegistry_->at(
                            shadowNode->getComponentHandle());
                    PropsParserContext propsParserContext{
                        family.getSurfaceId(), *contextContainer_.get()};
                    auto props = componentDescriptor.cloneProps(
                        propsParserContext,
                        getShadowNodeInSubtree(*shadowNode, ancestorShadowNode)
                            ->getProps(),
                        RawProps(rawProps));

                    return oldShadowNode.clone({/* .props = */ props});
                  });

              return std::static_pointer_cast<RootShadowNode>(rootNode);
            },
            {/* default commit options */});
      });
}

void UIManager::sendAccessibilityEvent(
    const ShadowNode::Shared& shadowNode,
    const std::string& eventType) {
  if (delegate_ != nullptr) {
    delegate_->uiManagerDidSendAccessibilityEvent(shadowNode, eventType);
  }
}

void UIManager::configureNextLayoutAnimation(
    jsi::Runtime& runtime,
    const RawValue& config,
    const jsi::Value& successCallback,
    const jsi::Value& failureCallback) const {
  if (animationDelegate_ != nullptr) {
    animationDelegate_->uiManagerDidConfigureNextLayoutAnimation(
        runtime,
        config,
        std::move(successCallback),
        std::move(failureCallback));
  }
}

static ShadowNode::Shared findShadowNodeByTagRecursively(
    ShadowNode::Shared parentShadowNode,
    Tag tag) {
  if (parentShadowNode->getTag() == tag) {
    return parentShadowNode;
  }

  for (const ShadowNode::Shared& shadowNode : parentShadowNode->getChildren()) {
    auto result = findShadowNodeByTagRecursively(shadowNode, tag);
    if (result) {
      return result;
    }
  }

  return nullptr;
}

ShadowNode::Shared UIManager::findShadowNodeByTag_DEPRECATED(Tag tag) const {
  auto shadowNode = ShadowNode::Shared{};

  shadowTreeRegistry_.enumerate([&](const ShadowTree& shadowTree, bool& stop) {
    const RootShadowNode* rootShadowNode;
    // The public interface of `ShadowTree` discourages accessing a stored
    // pointer to a root node because of the possible data race.
    // To work around this, we ask for a commit and immediately cancel it
    // returning `nullptr` instead of a new shadow tree.
    // We don't want to add a way to access a stored pointer to a root node
    // because this `findShadowNodeByTag` is deprecated. It is only added
    // to make migration to the new architecture easier.
    shadowTree.tryCommit(
        [&](const RootShadowNode& oldRootShadowNode) {
          rootShadowNode = &oldRootShadowNode;
          return nullptr;
        },
        {/* default commit options */});

    if (rootShadowNode != nullptr) {
      const auto& children = rootShadowNode->getChildren();
      if (!children.empty()) {
        const auto& child = children.front();
        shadowNode = findShadowNodeByTagRecursively(child, tag);
        if (shadowNode) {
          stop = true;
        }
      }
    }
  });

  return shadowNode;
}

void UIManager::setComponentDescriptorRegistry(
    const SharedComponentDescriptorRegistry& componentDescriptorRegistry) {
  componentDescriptorRegistry_ = componentDescriptorRegistry;
}

void UIManager::setDelegate(UIManagerDelegate* delegate) {
  delegate_ = delegate;
}

UIManagerDelegate* UIManager::getDelegate() {
  return delegate_;
}

void UIManager::visitBinding(
    const std::function<void(const UIManagerBinding& uiManagerBinding)>&
        callback,
    jsi::Runtime& runtime) const {
  auto uiManagerBinding = UIManagerBinding::getBinding(runtime);
  if (uiManagerBinding) {
    callback(*uiManagerBinding);
  }
}

const ShadowTreeRegistry& UIManager::getShadowTreeRegistry() const {
  return shadowTreeRegistry_;
}

void UIManager::registerCommitHook(UIManagerCommitHook& commitHook) {
  std::unique_lock lock(commitHookMutex_);
  react_native_assert(
      std::find(commitHooks_.begin(), commitHooks_.end(), &commitHook) ==
      commitHooks_.end());
  commitHook.commitHookWasRegistered(*this);
  commitHooks_.push_back(&commitHook);
}

void UIManager::unregisterCommitHook(UIManagerCommitHook& commitHook) {
  std::unique_lock lock(commitHookMutex_);
  auto iterator =
      std::find(commitHooks_.begin(), commitHooks_.end(), &commitHook);
  react_native_assert(iterator != commitHooks_.end());
  commitHooks_.erase(iterator);
  commitHook.commitHookWasUnregistered(*this);
}

void UIManager::registerMountHook(UIManagerMountHook& mountHook) {
  std::unique_lock lock(mountHookMutex_);
  react_native_assert(
      std::find(mountHooks_.begin(), mountHooks_.end(), &mountHook) ==
      mountHooks_.end());
  mountHooks_.push_back(&mountHook);
}

void UIManager::unregisterMountHook(UIManagerMountHook& mountHook) {
  std::unique_lock lock(mountHookMutex_);
  auto iterator = std::find(mountHooks_.begin(), mountHooks_.end(), &mountHook);
  react_native_assert(iterator != mountHooks_.end());
  mountHooks_.erase(iterator);
}

#pragma mark - ShadowTreeDelegate

RootShadowNode::Unshared UIManager::shadowTreeWillCommit(
    const ShadowTree& shadowTree,
    const RootShadowNode::Shared& oldRootShadowNode,
    const RootShadowNode::Unshared& newRootShadowNode) const {
  SystraceSection s("UIManager::shadowTreeWillCommit");

  std::shared_lock lock(commitHookMutex_);

  auto resultRootShadowNode = newRootShadowNode;
  for (auto* commitHook : commitHooks_) {
    resultRootShadowNode = commitHook->shadowTreeWillCommit(
        shadowTree, oldRootShadowNode, resultRootShadowNode);
  }

  return resultRootShadowNode;
}

void UIManager::shadowTreeDidFinishTransaction(
    MountingCoordinator::Shared mountingCoordinator,
    bool mountSynchronously) const {
  SystraceSection s("UIManager::shadowTreeDidFinishTransaction");

  if (delegate_ != nullptr) {
    delegate_->uiManagerDidFinishTransaction(
        std::move(mountingCoordinator), mountSynchronously);
  }
}

void UIManager::reportMount(SurfaceId surfaceId) const {
  SystraceSection s("UIManager::reportMount");

  auto time = JSExecutor::performanceNow();

  auto rootShadowNode = RootShadowNode::Shared{};
  shadowTreeRegistry_.visit(surfaceId, [&](const ShadowTree& shadowTree) {
    rootShadowNode =
        shadowTree.getMountingCoordinator()->getBaseRevision().rootShadowNode;
  });

  {
    std::shared_lock lock(mountHookMutex_);

    for (auto* mountHook : mountHooks_) {
      if (rootShadowNode) {
        mountHook->shadowTreeDidMount(rootShadowNode, time);
      } else {
        mountHook->shadowTreeDidUnmount(surfaceId, time);
      }
    }
  }
}

#pragma mark - UIManagerAnimationDelegate

void UIManager::setAnimationDelegate(UIManagerAnimationDelegate* delegate) {
  animationDelegate_ = delegate;
}

void UIManager::stopSurfaceForAnimationDelegate(SurfaceId surfaceId) const {
  if (animationDelegate_ != nullptr) {
    animationDelegate_->stopSurface(surfaceId);
  }
}

void UIManager::animationTick() const {
  if (animationDelegate_ != nullptr &&
      animationDelegate_->shouldAnimateFrame()) {
    shadowTreeRegistry_.enumerate([](const ShadowTree& shadowTree, bool&) {
      shadowTree.notifyDelegatesOfUpdates();
    });
  }
}

} // namespace facebook::react
