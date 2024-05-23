/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <cstdint>
#include <unordered_map>
#include <vector>

#include "PlatformTimerRegistry.h"

namespace facebook::react {

using TimerHandle = int;

/*
 * Wraps a jsi::Function to make it copyable so we can pass it into a lambda.
 */
struct TimerCallback {
  TimerCallback(
      jsi::Function callback,
      std::vector<jsi::Value> args,
      bool repeat)
      : callback_(std::move(callback)),
        args_(std::move(args)),
        repeat(repeat) {}

  void invoke(jsi::Runtime& runtime) {
    callback_.call(runtime, args_.data(), args_.size());
  }

  jsi::Function callback_;
  const std::vector<jsi::Value> args_;
  bool repeat;
};

class TimerManager {
 public:
  explicit TimerManager(
      std::unique_ptr<PlatformTimerRegistry> platformTimerRegistry) noexcept;

  void setRuntimeExecutor(RuntimeExecutor runtimeExecutor) noexcept;

  void callReactNativeMicrotasks(jsi::Runtime& runtime);

  void callTimer(TimerHandle handle);

  void attachGlobals(jsi::Runtime& runtime);

 private:
  TimerHandle createReactNativeMicrotask(
      jsi::Function&& callback,
      std::vector<jsi::Value>&& args);

  void deleteReactNativeMicrotask(jsi::Runtime& runtime, TimerHandle handle);

  TimerHandle createTimer(
      jsi::Function&& callback,
      std::vector<jsi::Value>&& args,
      double delay);

  void deleteTimer(jsi::Runtime& runtime, TimerHandle handle);

  TimerHandle createRecurringTimer(
      jsi::Function&& callback,
      std::vector<jsi::Value>&& args,
      double delay);

  void deleteRecurringTimer(jsi::Runtime& runtime, TimerHandle handle);

  RuntimeExecutor runtimeExecutor_;
  std::unique_ptr<PlatformTimerRegistry> platformTimerRegistry_;

  // A map (id => callback func) of the currently active JS timers
  std::unordered_map<TimerHandle, TimerCallback> timers_;

  // Each timeout that is registered on this queue gets a sequential id.  This
  // is the global count from which those are assigned.
  TimerHandle timerIndex_{0};

  // The React Native microtask queue is used to back public APIs including
  // `queueMicrotask`, `clearImmediate`, and `setImmediate` (which is used by
  // the Promise polyfill) when the JSVM microtask mechanism is not used.
  std::vector<TimerHandle> reactNativeMicrotasksQueue_;
};

} // namespace facebook::react
