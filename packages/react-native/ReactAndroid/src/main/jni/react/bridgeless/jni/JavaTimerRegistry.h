// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include <memory>

#include <fb/fbjni.h>
#include <react/bridgeless/PlatformTimerRegistry.h>

#include "JJavaTimerManager.h"

namespace facebook {
namespace react {

/**
 * Call into JavaTimerManager.java to schedule and delete timers
 * with the Platform.
 */
class JavaTimerRegistry : public PlatformTimerRegistry {
 public:
  JavaTimerRegistry(
      jni::global_ref<JJavaTimerManager::javaobject> javaTimerManager);

#pragma mark - PlatformTimerRegistry

  void createTimer(uint32_t timerID, double delayMS) override;
  void createRecurringTimer(uint32_t timerID, double delayMS) override;
  void deleteTimer(uint32_t timerID) override;

 private:
  jni::global_ref<JJavaTimerManager::javaobject> javaTimerManager_;
};

} // namespace react
} // namespace facebook
