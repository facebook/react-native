/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JJSTimerExecutor.h"

#include <fbjni/fbjni.h>
#include <jni.h>

namespace facebook::react {

void JJSTimerExecutor::setTimerManager(
    std::weak_ptr<TimerManager> timerManager) {
  timerManager_ = timerManager;
}

void JJSTimerExecutor::callTimers(WritableNativeArray* timerIDs) {
  if (auto timerManager = timerManager_.lock()) {
    for (const auto& timerID : timerIDs->consume()) {
      timerManager->callTimer((uint32_t)timerID.asInt());
    }
  }
}

void JJSTimerExecutor::registerNatives() {
  registerHybrid({
      makeNativeMethod("callTimers", JJSTimerExecutor::callTimers),
  });
}

} // namespace facebook::react
