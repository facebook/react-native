/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <fb/fbjni.h>
#include <jni.h>
#include <react/bridgeless/TimerManager.h>
#include <react/jni/WritableNativeArray.h>

namespace facebook::react {

class JJSTimerExecutor : public jni::HybridClass<JJSTimerExecutor> {
 public:
  JJSTimerExecutor() = default;

  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/bridgeless/JSTimerExecutor;";

  static void registerNatives();

  void setTimerManager(std::weak_ptr<TimerManager> timerManager);

  void callTimers(WritableNativeArray *timerIDs);

 private:
  friend HybridBase;

  std::weak_ptr<TimerManager> timerManager_;
};

} // namespace facebook::react
