// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/ShadowView.h>

namespace facebook::react {

class Scheduler;
class UIManager;

using SchedulerTask = std::function<void(Scheduler& scheduler)>;
using SchedulerTaskExecutor = std::function<void(SchedulerTask&& task)>;

using EventEmitterListener = std::function<bool(
    Tag eventTarget,
    const std::string& eventType,
    const EventPayload& eventPayload)>;

class IMountingManager {
 public:
  IMountingManager() noexcept = default;

  virtual ~IMountingManager() noexcept = default;

  IMountingManager(IMountingManager&&) noexcept = default;
  IMountingManager& operator=(IMountingManager&&) noexcept = default;
  IMountingManager(const IMountingManager&) = delete;
  IMountingManager& operator=(const IMountingManager&) = delete;

  virtual void executeMount(
      SurfaceId surfaceId,
      MountingTransaction&& mountingTransaction) = 0;

  virtual void dispatchCommand(
      const ShadowView& shadowView,
      const std::string& commandName,
      const folly::dynamic& args) = 0;

  virtual void setIsJSResponder(
      const ShadowView& shadowView,
      bool isJSResponder,
      bool blockNativeResponder) {};

  virtual void synchronouslyUpdateViewOnUIThread(
      Tag reactTag,
      const folly::dynamic& changedProps) {};

  virtual void initializeAccessibilityManager() {};

  virtual void setAccessibilityFocusedView(Tag viewTag) {};

  virtual void setFocusedView(Tag viewTag) {};

  virtual void clearAccessibilityFocusedView(Tag viewTag) {};

  virtual void accessibleClickAction(Tag viewTag) {};

  virtual void accessibleScrollInDirection(Tag viewTag, int direction) {};

  virtual void accessibleSetText(Tag viewTag, const std::string& text) {};

  virtual void clearFocusedView(Tag viewTag) {};

  virtual void setAfterMountCallback(
      std::function<void(SurfaceId)>&& onAfterMount) {};

  virtual ComponentRegistryFactory getComponentRegistryFactory() {
    return nullptr;
  }

  virtual bool hasComponent(const std::string& /*name*/) {
    return false;
  }

  virtual void setSchedulerTaskExecutor(
      SchedulerTaskExecutor&& schedulerTaskExecutor) noexcept {};

  virtual void setEventEmitterListener(
      std::shared_ptr<EventEmitterListener> listener) noexcept {};

  virtual void setUIManager(std::weak_ptr<UIManager> uiManager) noexcept {};
};

} // namespace facebook::react
