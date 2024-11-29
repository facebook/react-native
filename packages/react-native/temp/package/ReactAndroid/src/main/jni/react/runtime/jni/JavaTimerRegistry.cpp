/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JavaTimerRegistry.h"

namespace facebook::react {

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

} // namespace facebook::react
