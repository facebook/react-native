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

/*
 * A HostObject subclass representing the result of a setTimeout call.
 * Can be used as an argument to clearTimeout.
 */
class TimerHandle : public jsi::HostObject {
 public:
  explicit TimerHandle(uint32_t index) : index_(index) {}

  uint32_t index() const {
    return index_;
  }

  ~TimerHandle() override = default;

 private:
  // Index in the timeouts_ map of the owning SetTimeoutQueue.
  uint32_t index_;
};

/*
 * Wraps a jsi::Function to make it copyable so we can pass it into a lambda.
 */
struct TimerCallback {
  TimerCallback(TimerCallback&&) = default;

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

/**
 * Container for the IdleCallback.
 * The cotainer allow to cancel the Callback safely to avoid its execution
 */
struct IdleCallbackContainer {
  IdleCallbackContainer(std::shared_ptr<TimerCallback> idleCallback)
      : idleCallback_(idleCallback){};

  void cancel() {
    {
      std::lock_guard<std::mutex> lock(mutex_);
      cancelled_ = true;
    }
  }

  bool isCancelled() {
    {
      std::lock_guard<std::mutex> lock(mutex_);
      return cancelled_;
    }
  }

  std::shared_ptr<TimerCallback> idleCallback_;
  bool cancelled_{false};
  std::mutex mutex_{};
};

class TimerManager {
 public:
  explicit TimerManager(
      std::unique_ptr<PlatformTimerRegistry> platformTimerRegistry) noexcept;

  void setRuntimeExecutor(RuntimeExecutor runtimeExecutor) noexcept;

  void callReactNativeMicrotasks(jsi::Runtime& runtime);

  void callTimer(uint32_t);

  void attachGlobals(jsi::Runtime& runtime);

 private:
  std::shared_ptr<TimerHandle> createReactNativeMicrotask(
      jsi::Function&& callback,
      std::vector<jsi::Value>&& args);

  void deleteReactNativeMicrotask(
      jsi::Runtime& runtime,
      std::shared_ptr<TimerHandle> handle);

  std::shared_ptr<TimerHandle> createTimer(
      jsi::Function&& callback,
      std::vector<jsi::Value>&& args,
      double delay);

  void deleteTimer(jsi::Runtime& runtime, std::shared_ptr<TimerHandle> handle);

  std::shared_ptr<TimerHandle> createRecurringTimer(
      jsi::Function&& callback,
      std::vector<jsi::Value>&& args,
      double delay);

  void deleteRecurringTimer(
      jsi::Runtime& runtime,
      std::shared_ptr<TimerHandle> handle);

  std::shared_ptr<TimerHandle> createIdleCallback(jsi::Function&& callback);

  std::shared_ptr<TimerHandle> createIdleCallbackWithTimeout(
      jsi::Function&& callback,
      int32_t timeout);

  void clearIdleCallback(
      jsi::Runtime& runtime,
      std::shared_ptr<TimerHandle> idleCallbackHandle);

  RuntimeExecutor runtimeExecutor_;
  std::unique_ptr<PlatformTimerRegistry> platformTimerRegistry_;

  // A map (id => callback func) of the currently active JS timers
  std::unordered_map<uint32_t, std::shared_ptr<TimerCallback>> timers_;

  // Each timeout that is registered on this queue gets a sequential id.  This
  // is the global count from which those are assigned.
  uint32_t timerIndex_{0};

  // A map (id => callback func) of the currently active idleCallbacks
  std::unordered_map<uint32_t, std::shared_ptr<IdleCallbackContainer>>
      idleCallbacks_;

  // Each idle callback that is registered on this queue gets a sequential id.
  // This is the global count from which those are assigned.
  uint32_t idleCallbackIndex_{0};

  // The React Native microtask queue is used to back public APIs including
  // `queueMicrotask`, `clearImmediate`, and `setImmediate` (which is used by
  // the Promise polyfill) when the JSVM microtask mechanism is not used.
  std::vector<uint32_t> reactNativeMicrotasksQueue_;
};

} // namespace facebook::react
