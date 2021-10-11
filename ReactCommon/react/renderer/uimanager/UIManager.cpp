/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UIManager.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/debug/SystraceSection.h>
#include <react/renderer/graphics/Geometry.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>

#include <glog/logging.h>

namespace facebook::react {

static std::unique_ptr<LeakChecker> constructLeakCheckerIfNeeded(
    RuntimeExecutor const &runtimeExecutor) {
#ifdef REACT_NATIVE_DEBUG
  return std::make_unique<LeakChecker>(runtimeExecutor);
#else
  return {};
#endif
}

UIManager::UIManager(
    RuntimeExecutor const &runtimeExecutor,
    BackgroundExecutor const &backgroundExecutor,
    ContextContainer::Shared contextContainer)
    : runtimeExecutor_(runtimeExecutor),
      backgroundExecutor_(backgroundExecutor),
      contextContainer_(contextContainer),
      leakChecker_(constructLeakCheckerIfNeeded(runtimeExecutor)) {}

UIManager::~UIManager() {
  LOG(WARNING) << "UIManager::~UIManager() was called (address: " << this
               << ").";
}

SharedShadowNode UIManager::createNode(
    Tag tag,
    std::string const &name,
    SurfaceId surfaceId,
    const RawProps &rawProps,
    SharedEventTarget eventTarget) const {
  SystraceSection s("UIManager::createNode");

  auto &componentDescriptor = componentDescriptorRegistry_->at(name);
  auto fallbackDescriptor =
      componentDescriptorRegistry_->getFallbackComponentDescriptor();

  PropsParserContext propsParserContext{surfaceId, *contextContainer_.get()};

  auto const fragment = ShadowNodeFamilyFragment{tag, surfaceId, nullptr};
  auto family =
      componentDescriptor.createFamily(fragment, std::move(eventTarget));
  auto const props =
      componentDescriptor.cloneProps(propsParserContext, nullptr, rawProps);
  auto const state =
      componentDescriptor.createInitialState(ShadowNodeFragment{props}, family);

  auto shadowNode = componentDescriptor.createShadowNode(
      ShadowNodeFragment{
          /* .props = */
          fallbackDescriptor != nullptr &&
                  fallbackDescriptor->getComponentHandle() ==
                      componentDescriptor.getComponentHandle()
              ? componentDescriptor.cloneProps(
                    propsParserContext,
                    props,
                    RawProps(folly::dynamic::object("name", name)))
              : props,
          /* .children = */ ShadowNodeFragment::childrenPlaceholder(),
          /* .state = */ state,
      },
      family);

  if (delegate_) {
    delegate_->uiManagerDidCreateShadowNode(*shadowNode.get());
  }
  if (leakChecker_) {
    leakChecker_->uiManagerDidCreateShadowNodeFamily(family);
  }

  return shadowNode;
}

SharedShadowNode UIManager::cloneNode(
    const ShadowNode::Shared &shadowNode,
    const SharedShadowNodeSharedList &children,
    const RawProps *rawProps) const {
  SystraceSection s("UIManager::cloneNode");

  PropsParserContext propsParserContext{
      shadowNode->getFamily().getSurfaceId(), *contextContainer_.get()};

  auto &componentDescriptor = shadowNode->getComponentDescriptor();
  auto clonedShadowNode = componentDescriptor.cloneShadowNode(
      *shadowNode,
      {
          /* .props = */
          rawProps ? componentDescriptor.cloneProps(
                         propsParserContext, shadowNode->getProps(), *rawProps)
                   : ShadowNodeFragment::propsPlaceholder(),
          /* .children = */ children,
      });

  if (delegate_) {
    delegate_->uiManagerDidCloneShadowNode(
        *shadowNode.get(), *clonedShadowNode.get());
  }

  return clonedShadowNode;
}

void UIManager::appendChild(
    const ShadowNode::Shared &parentShadowNode,
    const ShadowNode::Shared &childShadowNode) const {
  SystraceSection s("UIManager::appendChild");

  auto &componentDescriptor = parentShadowNode->getComponentDescriptor();
  componentDescriptor.appendChild(parentShadowNode, childShadowNode);
}

void UIManager::completeSurface(
    SurfaceId surfaceId,
    SharedShadowNodeUnsharedList const &rootChildren,
    ShadowTree::CommitOptions commitOptions) const {
  SystraceSection s("UIManager::completeSurface");

  shadowTreeRegistry_.visit(surfaceId, [&](ShadowTree const &shadowTree) {
    shadowTree.commit(
        [&](RootShadowNode const &oldRootShadowNode) {
          return std::make_shared<RootShadowNode>(
              oldRootShadowNode,
              ShadowNodeFragment{
                  /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                  /* .children = */ rootChildren,
              });
        },
        commitOptions);
  });
}

void UIManager::setIsJSResponder(
    ShadowNode::Shared const &shadowNode,
    bool isJSResponder,
    bool blockNativeResponder) const {
  if (delegate_) {
    delegate_->uiManagerDidSetIsJSResponder(
        shadowNode, isJSResponder, blockNativeResponder);
  }
}

void UIManager::startSurface(
    ShadowTree::Unique &&shadowTree,
    std::string const &moduleName,
    folly::dynamic const &props,
    DisplayMode displayMode) const {
  SystraceSection s("UIManager::startSurface");

  auto surfaceId = shadowTree->getSurfaceId();
  shadowTreeRegistry_.add(std::move(shadowTree));

  runtimeExecutor_([=](jsi::Runtime &runtime) {
    SystraceSection s("UIManager::startSurface::onRuntime");
    auto uiManagerBinding = UIManagerBinding::getBinding(runtime);
    if (!uiManagerBinding) {
      return;
    }

    uiManagerBinding->startSurface(
        runtime, surfaceId, moduleName, props, displayMode);
  });
}

void UIManager::setSurfaceProps(
    SurfaceId surfaceId,
    std::string const &moduleName,
    folly::dynamic const &props,
    DisplayMode displayMode) const {
  SystraceSection s("UIManager::setSurfaceProps");

  runtimeExecutor_([=](jsi::Runtime &runtime) {
    auto uiManagerBinding = UIManagerBinding::getBinding(runtime);
    if (!uiManagerBinding) {
      return;
    }

    uiManagerBinding->setSurfaceProps(
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

  // We execute JavaScript/React part of the process at the very end to minimize
  // any visible side-effects of stopping the Surface. Any possible commits from
  // the JavaScript side will not be able to reference a `ShadowTree` and will
  // fail silently.
  runtimeExecutor_([=](jsi::Runtime &runtime) {
    auto uiManagerBinding = UIManagerBinding::getBinding(runtime);
    if (!uiManagerBinding) {
      return;
    }

    uiManagerBinding->stopSurface(runtime, surfaceId);
  });

  if (leakChecker_) {
    leakChecker_->stopSurface(surfaceId);
  }

  return shadowTree;
}

ShadowNode::Shared UIManager::getNewestCloneOfShadowNode(
    ShadowNode const &shadowNode) const {
  auto ancestorShadowNode = ShadowNode::Shared{};
  shadowTreeRegistry_.visit(
      shadowNode.getSurfaceId(), [&](ShadowTree const &shadowTree) {
        ancestorShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
      });

  if (!ancestorShadowNode) {
    return nullptr;
  }

  auto ancestors = shadowNode.getFamily().getAncestors(*ancestorShadowNode);

  if (ancestors.empty()) {
    return nullptr;
  }

  auto pair = ancestors.rbegin();
  return pair->first.get().getChildren().at(pair->second);
}

ShadowNode::Shared UIManager::findNodeAtPoint(
    ShadowNode::Shared const &node,
    Point point) const {
  return LayoutableShadowNode::findNodeAtPoint(
      getNewestCloneOfShadowNode(*node), point);
}

LayoutMetrics UIManager::getRelativeLayoutMetrics(
    ShadowNode const &shadowNode,
    ShadowNode const *ancestorShadowNode,
    LayoutableShadowNode::LayoutInspectingPolicy policy) const {
  SystraceSection s("UIManager::getRelativeLayoutMetrics");

  // We might store here an owning pointer to `ancestorShadowNode` to ensure
  // that the node is not deallocated during method execution lifetime.
  auto owningAncestorShadowNode = ShadowNode::Shared{};

  if (!ancestorShadowNode) {
    shadowTreeRegistry_.visit(
        shadowNode.getSurfaceId(), [&](ShadowTree const &shadowTree) {
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
      traitCast<LayoutableShadowNode const *>(ancestorShadowNode);

  if (!layoutableAncestorShadowNode) {
    return EmptyLayoutMetrics;
  }

  return LayoutableShadowNode::computeRelativeLayoutMetrics(
      shadowNode.getFamily(), *layoutableAncestorShadowNode, policy);
}

void UIManager::updateState(StateUpdate const &stateUpdate) const {
  auto &callback = stateUpdate.callback;
  auto &family = stateUpdate.family;
  auto &componentDescriptor = family->getComponentDescriptor();

  shadowTreeRegistry_.visit(
      family->getSurfaceId(), [&](ShadowTree const &shadowTree) {
        shadowTree.commit([&](RootShadowNode const &oldRootShadowNode) {
          auto isValid = true;

          auto rootNode = oldRootShadowNode.cloneTree(
              *family, [&](ShadowNode const &oldShadowNode) {
                auto newData =
                    callback(oldShadowNode.getState()->getDataPointer());

                if (!newData) {
                  isValid = false;
                  // Just return something, we will discard it anyway.
                  return oldShadowNode.clone({});
                }

                auto newState =
                    componentDescriptor.createState(*family, newData);

                return oldShadowNode.clone({
                    /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                    /* .children = */
                    ShadowNodeFragment::childrenPlaceholder(),
                    /* .state = */ newState,
                });
              });

          return isValid ? std::static_pointer_cast<RootShadowNode>(rootNode)
                         : nullptr;
        });
      });
}

void UIManager::dispatchCommand(
    const ShadowNode::Shared &shadowNode,
    std::string const &commandName,
    folly::dynamic const args) const {
  if (delegate_) {
    delegate_->uiManagerDidDispatchCommand(shadowNode, commandName, args);
  }
}

void UIManager::sendAccessibilityEvent(
    const ShadowNode::Shared &shadowNode,
    std::string const &eventType) {
  if (delegate_) {
    delegate_->uiManagerDidSendAccessibilityEvent(shadowNode, eventType);
  }
}

void UIManager::configureNextLayoutAnimation(
    jsi::Runtime &runtime,
    RawValue const &config,
    jsi::Value const &successCallback,
    jsi::Value const &failureCallback) const {
  if (animationDelegate_) {
    animationDelegate_->uiManagerDidConfigureNextLayoutAnimation(
        runtime,
        config,
        std::move(successCallback),
        std::move(failureCallback));
  }
}

void UIManager::setComponentDescriptorRegistry(
    const SharedComponentDescriptorRegistry &componentDescriptorRegistry) {
  componentDescriptorRegistry_ = componentDescriptorRegistry;
}

void UIManager::setDelegate(UIManagerDelegate *delegate) {
  delegate_ = delegate;
}

UIManagerDelegate *UIManager::getDelegate() {
  return delegate_;
}

void UIManager::visitBinding(
    std::function<void(UIManagerBinding const &uiManagerBinding)> callback,
    jsi::Runtime &runtime) const {
  auto uiManagerBinding = UIManagerBinding::getBinding(runtime);
  if (uiManagerBinding) {
    callback(*uiManagerBinding);
  }
}

ShadowTreeRegistry const &UIManager::getShadowTreeRegistry() const {
  return shadowTreeRegistry_;
}

void UIManager::registerCommitHook(
    UIManagerCommitHook const &commitHook) const {
  std::unique_lock<better::shared_mutex> lock(commitHookMutex_);
  react_native_assert(
      std::find(commitHooks_.begin(), commitHooks_.end(), &commitHook) ==
      commitHooks_.end());
  commitHook.commitHookWasRegistered(*this);
  commitHooks_.push_back(&commitHook);
}

void UIManager::unregisterCommitHook(
    UIManagerCommitHook const &commitHook) const {
  std::unique_lock<better::shared_mutex> lock(commitHookMutex_);
  auto iterator =
      std::find(commitHooks_.begin(), commitHooks_.end(), &commitHook);
  react_native_assert(iterator != commitHooks_.end());
  commitHooks_.erase(iterator);
  commitHook.commitHookWasUnregistered(*this);
}

#pragma mark - ShadowTreeDelegate

RootShadowNode::Unshared UIManager::shadowTreeWillCommit(
    ShadowTree const &shadowTree,
    RootShadowNode::Shared const &oldRootShadowNode,
    RootShadowNode::Unshared const &newRootShadowNode) const {
  std::shared_lock<better::shared_mutex> lock(commitHookMutex_);

  auto resultRootShadowNode = newRootShadowNode;
  for (auto const *commitHook : commitHooks_) {
    resultRootShadowNode = commitHook->shadowTreeWillCommit(
        shadowTree, oldRootShadowNode, resultRootShadowNode);
  }

  return resultRootShadowNode;
}

void UIManager::shadowTreeDidFinishTransaction(
    ShadowTree const &shadowTree,
    MountingCoordinator::Shared const &mountingCoordinator) const {
  SystraceSection s("UIManager::shadowTreeDidFinishTransaction");

  if (delegate_) {
    delegate_->uiManagerDidFinishTransaction(mountingCoordinator);
  }
}

#pragma mark - UIManagerAnimationDelegate

void UIManager::setAnimationDelegate(UIManagerAnimationDelegate *delegate) {
  animationDelegate_ = delegate;
}

void UIManager::stopSurfaceForAnimationDelegate(SurfaceId surfaceId) const {
  if (animationDelegate_ != nullptr) {
    animationDelegate_->stopSurface(surfaceId);
  }
}

void UIManager::animationTick() {
  if (animationDelegate_ != nullptr &&
      animationDelegate_->shouldAnimateFrame()) {
    shadowTreeRegistry_.enumerate(
        [&](ShadowTree const &shadowTree, bool &stop) {
          shadowTree.notifyDelegatesOfUpdates();
        });
  }
}

} // namespace facebook::react
