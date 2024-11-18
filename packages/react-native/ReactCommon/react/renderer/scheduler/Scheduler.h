/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>

#include <ReactCommon/RuntimeExecutor.h>
#include <react/performance/timeline/PerformanceEntryReporter.h>
#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/EventEmitter.h>
#include <react/renderer/core/EventListener.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/mounting/MountingOverrideDelegate.h>
#include <react/renderer/observers/events/EventPerformanceLogger.h>
#include <react/renderer/scheduler/InspectorData.h>
#include <react/renderer/scheduler/SchedulerDelegate.h>
#include <react/renderer/scheduler/SchedulerToolbox.h>
#include <react/renderer/scheduler/SurfaceHandler.h>
#include <react/renderer/uimanager/UIManagerAnimationDelegate.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/UIManagerDelegate.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

/*
 * Scheduler coordinates Shadow Tree updates and event flows.
 */
class Scheduler final : public UIManagerDelegate {
 public:
  Scheduler(
      const SchedulerToolbox& schedulerToolbox,
      UIManagerAnimationDelegate* animationDelegate,
      SchedulerDelegate* delegate);
  ~Scheduler() override;

#pragma mark - Surface Management

  /*
   * Registers and unregisters a `SurfaceHandler` object in the `Scheduler`.
   * All registered `SurfaceHandler` objects must be unregistered
   * (with the same `Scheduler`) before their deallocation.
   */
  void registerSurface(const SurfaceHandler& surfaceHandler) const noexcept;
  void unregisterSurface(const SurfaceHandler& surfaceHandler) const noexcept;

  InspectorData getInspectorDataForInstance(
      const EventEmitter& eventEmitter) const noexcept;

  /*
   * This is broken. Please do not use.
   * `ComponentDescriptor`s are not designed to be used outside of `UIManager`,
   * there is no any guarantees about their lifetime.
   */
  const ComponentDescriptor*
  findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(
      ComponentHandle handle) const;

#pragma mark - Delegate

  /*
   * Sets and gets the Scheduler's delegate.
   * If you requesting a ComponentDescriptor and unsure that it's there, you are
   * doing something wrong.
   */
  void setDelegate(SchedulerDelegate* delegate);
  SchedulerDelegate* getDelegate() const;

#pragma mark - UIManagerAnimationDelegate
  // This is not needed on iOS or any platform that has a "pull" instead of
  // "push" MountingCoordinator model. This just tells the delegate an update
  // is available and that it should `pullTransaction`; we may want to rename
  // this to be more generic and not animation-specific.
  void animationTick() const;

#pragma mark - UIManagerDelegate

  void uiManagerDidFinishTransaction(
      std::shared_ptr<const MountingCoordinator> mountingCoordinator,
      bool mountSynchronously) override;
  void uiManagerDidCreateShadowNode(const ShadowNode& shadowNode) override;
  void uiManagerDidDispatchCommand(
      const ShadowNode::Shared& shadowNode,
      const std::string& commandName,
      const folly::dynamic& args) override;
  void uiManagerDidSendAccessibilityEvent(
      const ShadowNode::Shared& shadowNode,
      const std::string& eventType) override;
  void uiManagerDidSetIsJSResponder(
      const ShadowNode::Shared& shadowNode,
      bool isJSResponder,
      bool blockNativeResponder) override;

#pragma mark - ContextContainer
  ContextContainer::Shared getContextContainer() const;

#pragma mark - UIManager
  std::shared_ptr<UIManager> getUIManager() const;

  void reportMount(SurfaceId surfaceId) const;

#pragma mark - Event listeners
  void addEventListener(std::shared_ptr<const EventListener> listener);
  void removeEventListener(
      const std::shared_ptr<const EventListener>& listener);

 private:
  friend class SurfaceHandler;

  SchedulerDelegate* delegate_;
  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  RuntimeExecutor runtimeExecutor_;
  std::shared_ptr<UIManager> uiManager_;

  std::vector<std::shared_ptr<UIManagerCommitHook>> commitHooks_;

  /*
   * At some point, we have to have an owning shared pointer to something that
   * will become an `EventDispatcher` a moment later. That's why we have it as a
   * pointer to an optional: we construct the pointer first, share that with
   * parts that need to have ownership (and only ownership) of that, and then
   * fill the optional.
   */
  std::shared_ptr<std::optional<const EventDispatcher>> eventDispatcher_;

  std::shared_ptr<PerformanceEntryReporter> performanceEntryReporter_;
  std::shared_ptr<EventPerformanceLogger> eventPerformanceLogger_;

  /**
   * Hold onto ContextContainer. See SchedulerToolbox.
   * Must not be nullptr.
   */
  ContextContainer::Shared contextContainer_;

  RuntimeScheduler* runtimeScheduler_{nullptr};
};

} // namespace facebook::react
