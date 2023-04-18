// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#include "JavaTimerRegistry.h"

namespace facebook {
namespace react {

JavaTimerRegistry::JavaTimerRegistry(
    jni::global_ref<JJavaTimerManager::javaobject> javaTimerManager)
    : javaTimerManager_(javaTimerManager) {}

void JavaTimerRegistry::createTimer(uint32_t timerID, double delayMS) {
  javaTimerManager_->createTimer(timerID, delayMS, /* repeat */ false);
}

void JavaTimerRegistry::createRecurringTimer(uint32_t timerID, double delayMS) {
  javaTimerManager_->createTimer(timerID, delayMS, /* repeat */ true);
}

void JavaTimerRegistry::deleteTimer(uint32_t timerID) {
  javaTimerManager_->deleteTimer(timerID);
}

} // namespace react
} // namespace facebook
