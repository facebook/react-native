/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Scheduler.h"

#include <glog/logging.h>
#include <jsi/jsi.h>

#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/debug/SystraceSection.h>
#include <react/renderer/mounting/MountingOverrideDelegate.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/templateprocessor/UITemplateProcessor.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerBinding.h>

#ifdef RN_SHADOW_TREE_INTROSPECTION
#include <react/renderer/mounting/stubs.h>
#include <iostream>
#endif

namespace facebook {
namespace react {

Scheduler::Scheduler(
    SchedulerToolbox schedulerToolbox,
    UIManagerAnimationDelegate *animationDelegate,
    SchedulerDelegate *delegate) {
  runtimeExecutor_ = schedulerToolbox.runtimeExecutor;

  reactNativeConfig_ =
      schedulerToolbox.contextContainer
          ->at<std::shared_ptr<const ReactNativeConfig>>("ReactNativeConfig");

  // Creating a container for future `EventDispatcher` instance.
  eventDispatcher_ =
      std::make_shared<better::optional<EventDispatcher const>>();

  auto uiManager = std::make_shared<UIManager>();
  auto eventOwnerBox = std::make_shared<EventBeat::OwnerBox>();
  eventOwnerBox->owner = eventDispatcher_;

  auto eventPipe = [uiManager](
                       jsi::Runtime &runtime,
                       const EventTarget *eventTarget,
                       const std::string &type,
                       const ValueFactory &payloadFactory) {
    uiManager->visitBinding([&](UIManagerBinding const &uiManagerBinding) {
      uiManagerBinding.dispatchEvent(
          runtime, eventTarget, type, payloadFactory);
    });
  };

  auto statePipe = [uiManager](StateUpdate const &stateUpdate) {
    uiManager->updateState(stateUpdate);
  };

  // Creating an `EventDispatcher` instance inside the already allocated
  // container (inside the optional).
  eventDispatcher_->emplace(
      eventPipe,
      statePipe,
      schedulerToolbox.synchronousEventBeatFactory,
      schedulerToolbox.asynchronousEventBeatFactory,
      eventOwnerBox);

  // Casting to `std::shared_ptr<EventDispatcher const>`.
  auto eventDispatcher =
      EventDispatcher::Shared{eventDispatcher_, &eventDispatcher_->value()};

  componentDescriptorRegistry_ = schedulerToolbox.componentRegistryFactory(
      eventDispatcher, schedulerToolbox.contextContainer);

  rootComponentDescriptor_ = std::make_unique<const RootComponentDescriptor>(
      ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});

  uiManager->setBackgroundExecutor(schedulerToolbox.backgroundExecutor);
  uiManager->setDelegate(this);
  uiManager->setComponentDescriptorRegistry(componentDescriptorRegistry_);

  runtimeExecutor_([=](jsi::Runtime &runtime) {
    auto uiManagerBinding = UIManagerBinding::createAndInstallIfNeeded(runtime);
    uiManagerBinding->attach(uiManager);
  });

  auto componentDescriptorRegistryKey =
      "ComponentDescriptorRegistry_DO_NOT_USE_PRETTY_PLEASE";
  schedulerToolbox.contextContainer->erase(componentDescriptorRegistryKey);
  schedulerToolbox.contextContainer->insert(
      componentDescriptorRegistryKey,
      std::weak_ptr<ComponentDescriptorRegistry const>(
          componentDescriptorRegistry_));

  delegate_ = delegate;
  uiManager_ = uiManager;

  if (animationDelegate != nullptr) {
    animationDelegate->setComponentDescriptorRegistry(
        componentDescriptorRegistry_);
  }
  uiManager_->setAnimationDelegate(animationDelegate);

#ifdef ANDROID
  enableReparentingDetection_ = reactNativeConfig_->getBool(
      "react_fabric:enable_reparenting_detection_android");
  removeOutstandingSurfacesOnDestruction_ = reactNativeConfig_->getBool(
      "react_fabric:remove_outstanding_surfaces_on_destruction_android");
  uiManager_->experimentEnableStateUpdateWithAutorepeat =
      reactNativeConfig_->getBool(
          "react_fabric:enable_state_update_with_autorepeat_android");
#else
  enableReparentingDetection_ = reactNativeConfig_->getBool(
      "react_fabric:enable_reparenting_detection_ios");
  removeOutstandingSurfacesOnDestruction_ = reactNativeConfig_->getBool(
      "react_fabric:remove_outstanding_surfaces_on_destruction_ios");
  uiManager_->experimentEnableStateUpdateWithAutorepeat =
      reactNativeConfig_->getBool(
          "react_fabric:enable_state_update_with_autorepeat_ios");
#endif
}

Scheduler::~Scheduler() {
  LOG(WARNING) << "Scheduler::~Scheduler() was called (address: " << this
               << ").";

  // All Surfaces must be explicitly stopped before destroying `Scheduler`.
  // The idea is that `UIManager` is allowed to call `Scheduler` only if the
  // corresponding `ShadowTree` instance exists.

  // The thread-safety of this operation is guaranteed by this requirement.
  uiManager_->setDelegate(nullptr);
  uiManager_->setAnimationDelegate(nullptr);

  // Then, let's verify that the requirement was satisfied.
  auto surfaceIds = std::vector<SurfaceId>{};
  uiManager_->getShadowTreeRegistry().enumerate(
      [&](ShadowTree const &shadowTree, bool &stop) {
        surfaceIds.push_back(shadowTree.getSurfaceId());
      });

  assert(
      surfaceIds.empty() &&
      "Scheduler was destroyed with outstanding Surfaces.");

  if (surfaceIds.empty()) {
    return;
  }

  LOG(ERROR) << "Scheduler was destroyed with outstanding Surfaces.";

  // If we are here, that means assert didn't fire which indicates that we in
  // production.

  // Now we have still-running surfaces, which is no good, no good.
  // That's indeed a sign of a severe issue on the application layer.
  // At this point, we don't have much to lose, so we are trying to unmount all
  // outstanding `ShadowTree`s to prevent all stored JSI entities from
  // overliving the `Scheduler`. (Unmounting `ShadowNode`s disables
  // `EventEmitter`s which destroys JSI objects.)
  for (auto surfaceId : surfaceIds) {
    uiManager_->getShadowTreeRegistry().visit(
        surfaceId,
        [](ShadowTree const &shadowTree) { shadowTree.commitEmptyTree(); });

    // Removing surfaces is gated because it acquires mutex waiting for commits
    // in flight; in theory, it can deadlock.
    if (removeOutstandingSurfacesOnDestruction_) {
      uiManager_->getShadowTreeRegistry().remove(surfaceId);
    }
  }
}

void Scheduler::startSurface(
    SurfaceId surfaceId,
    const std::string &moduleName,
    const folly::dynamic &initialProps,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext,
    std::weak_ptr<MountingOverrideDelegate const> mountingOverrideDelegate)
    const {
  SystraceSection s("Scheduler::startSurface");

  auto shadowTree = std::make_unique<ShadowTree>(
      surfaceId,
      layoutConstraints,
      layoutContext,
      *rootComponentDescriptor_,
      *uiManager_,
      mountingOverrideDelegate,
      enableReparentingDetection_);

  auto uiManager = uiManager_;

  uiManager->getShadowTreeRegistry().add(std::move(shadowTree));

  runtimeExecutor_([=](jsi::Runtime &runtime) {
    uiManager->visitBinding([&](UIManagerBinding const &uiManagerBinding) {
      uiManagerBinding.startSurface(
          runtime, surfaceId, moduleName, initialProps);
    });
  });
}

void Scheduler::renderTemplateToSurface(
    SurfaceId surfaceId,
    const std::string &uiTemplate) {
  SystraceSection s("Scheduler::renderTemplateToSurface");
  try {
    if (uiTemplate.empty()) {
      return;
    }
    NativeModuleRegistry nMR;
    auto tree = UITemplateProcessor::buildShadowTree(
        uiTemplate,
        surfaceId,
        folly::dynamic::object(),
        *componentDescriptorRegistry_,
        nMR,
        reactNativeConfig_);

    uiManager_->getShadowTreeRegistry().visit(
        surfaceId, [=](const ShadowTree &shadowTree) {
          return shadowTree.tryCommit(
              [&](RootShadowNode const &oldRootShadowNode) {
                return std::make_shared<RootShadowNode>(
                    oldRootShadowNode,
                    ShadowNodeFragment{
                        /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                        /* .children = */
                        std::make_shared<SharedShadowNodeList>(
                            SharedShadowNodeList{tree}),
                    });
              });
        });
  } catch (const std::exception &e) {
    LOG(ERROR) << "    >>>> EXCEPTION <<<  rendering uiTemplate in "
               << "Scheduler::renderTemplateToSurface: " << e.what();
  }
}

void Scheduler::stopSurface(SurfaceId surfaceId) const {
  SystraceSection s("Scheduler::stopSurface");

  // Stop any ongoing animations.
  uiManager_->stopSurfaceForAnimationDelegate(surfaceId);

  // Waiting for all concurrent commits to be finished and unregistering the
  // `ShadowTree`.
  auto shadowTree = uiManager_->getShadowTreeRegistry().remove(surfaceId);

  // As part of stopping a Surface, we need to properly destroy all
  // mounted views, so we need to commit an empty tree to trigger all
  // side-effects (including destroying and removing mounted views).
  if (shadowTree) {
    shadowTree->commitEmptyTree();
  }

  // We execute JavaScript/React part of the process at the very end to minimize
  // any visible side-effects of stopping the Surface. Any possible commits from
  // the JavaScript side will not be able to reference a `ShadowTree` and will
  // fail silently.
  auto uiManager = uiManager_;
  runtimeExecutor_([=](jsi::Runtime &runtime) {
    uiManager->visitBinding([&](UIManagerBinding const &uiManagerBinding) {
      uiManagerBinding.stopSurface(runtime, surfaceId);
    });
  });
}

Size Scheduler::measureSurface(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  SystraceSection s("Scheduler::measureSurface");

  auto currentRootShadowNode = RootShadowNode::Shared{};
  uiManager_->getShadowTreeRegistry().visit(
      surfaceId, [&](const ShadowTree &shadowTree) {
        currentRootShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
      });

  auto rootShadowNode =
      currentRootShadowNode->clone(layoutConstraints, layoutContext);
  rootShadowNode->layoutIfNeeded();
  return rootShadowNode->getLayoutMetrics().frame.size;
}

MountingCoordinator::Shared Scheduler::findMountingCoordinator(
    SurfaceId surfaceId) const {
  MountingCoordinator::Shared mountingCoordinator = nullptr;
  uiManager_->getShadowTreeRegistry().visit(
      surfaceId, [&](const ShadowTree &shadowTree) {
        mountingCoordinator = shadowTree.getMountingCoordinator();
      });
  return mountingCoordinator;
}

void Scheduler::constraintSurfaceLayout(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  SystraceSection s("Scheduler::constraintSurfaceLayout");

  uiManager_->getShadowTreeRegistry().visit(
      surfaceId, [&](ShadowTree const &shadowTree) {
        shadowTree.commit([&](RootShadowNode const &oldRootShadowNode) {
          return oldRootShadowNode.clone(layoutConstraints, layoutContext);
        });
      });
}

ComponentDescriptor const *
Scheduler::findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(
    ComponentHandle handle) const {
  return componentDescriptorRegistry_
      ->findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(handle);
}

#pragma mark - Delegate

void Scheduler::setDelegate(SchedulerDelegate *delegate) {
  delegate_ = delegate;
}

SchedulerDelegate *Scheduler::getDelegate() const {
  return delegate_;
}

#pragma mark - UIManagerAnimationDelegate

void Scheduler::animationTick() const {
  uiManager_->animationTick();
}

#pragma mark - UIManagerDelegate

void Scheduler::uiManagerDidFinishTransaction(
    MountingCoordinator::Shared const &mountingCoordinator) {
  SystraceSection s("Scheduler::uiManagerDidFinishTransaction");

  if (delegate_) {
    delegate_->schedulerDidFinishTransaction(mountingCoordinator);
  }
}
void Scheduler::uiManagerDidCreateShadowNode(
    const ShadowNode::Shared &shadowNode) {
  SystraceSection s("Scheduler::uiManagerDidCreateShadowNode");

  if (delegate_) {
    auto shadowView = ShadowView(*shadowNode);
    delegate_->schedulerDidRequestPreliminaryViewAllocation(
        shadowNode->getSurfaceId(), shadowView);
  }
}

void Scheduler::uiManagerDidDispatchCommand(
    const ShadowNode::Shared &shadowNode,
    std::string const &commandName,
    folly::dynamic const args) {
  SystraceSection s("Scheduler::uiManagerDispatchCommand");

  if (delegate_) {
    auto shadowView = ShadowView(*shadowNode);
    delegate_->schedulerDidDispatchCommand(shadowView, commandName, args);
  }
}

/*
 * Set JS responder for a view
 */
void Scheduler::uiManagerDidSetJSResponder(
    SurfaceId surfaceId,
    const ShadowNode::Shared &shadowNode,
    bool blockNativeResponder) {
  if (delegate_) {
    // TODO: the first shadowView paramenter, should be the first parent that
    // is non virtual.
    auto shadowView = ShadowView(*shadowNode);
    delegate_->schedulerDidSetJSResponder(
        surfaceId, shadowView, shadowView, blockNativeResponder);
  }
}

/*
 * Clear the JSResponder for a view
 */
void Scheduler::uiManagerDidClearJSResponder() {
  if (delegate_) {
    delegate_->schedulerDidClearJSResponder();
  }
}

} // namespace react
} // namespace facebook
