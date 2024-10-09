/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TimerManager.h"

#include <cxxreact/SystraceSection.h>
#include <utility>

namespace facebook::react {

TimerManager::TimerManager(
    std::unique_ptr<PlatformTimerRegistry> platformTimerRegistry) noexcept
    : platformTimerRegistry_(std::move(platformTimerRegistry)) {}

void TimerManager::setRuntimeExecutor(
    RuntimeExecutor runtimeExecutor) noexcept {
  runtimeExecutor_ = runtimeExecutor;
}

TimerHandle TimerManager::createReactNativeMicrotask(
    jsi::Function&& callback,
    std::vector<jsi::Value>&& args) {
  // Get the id for the callback.
  TimerHandle timerID = timerIndex_++;
  timers_.emplace(
      std::piecewise_construct,
      std::forward_as_tuple(timerID),
      std::forward_as_tuple(
          std::move(callback), std::move(args), /* repeat */ false));

  reactNativeMicrotasksQueue_.push_back(timerID);
  return timerID;
}

void TimerManager::callReactNativeMicrotasks(jsi::Runtime& runtime) {
  std::vector<TimerHandle> reactNativeMicrotasksQueue;
  while (!reactNativeMicrotasksQueue_.empty()) {
    reactNativeMicrotasksQueue.clear();
    reactNativeMicrotasksQueue.swap(reactNativeMicrotasksQueue_);

    for (auto reactNativeMicrotaskID : reactNativeMicrotasksQueue) {
      // ReactNativeMicrotasks can clear other scheduled reactNativeMicrotasks.
      auto it = timers_.find(reactNativeMicrotaskID);
      if (it != timers_.end()) {
        it->second.invoke(runtime);

        // Invoking a timer has the potential to delete it. Do not re-use the
        // existing iterator to erase it from the map.
        timers_.erase(reactNativeMicrotaskID);
      }
    }
  }
}

TimerHandle TimerManager::createTimer(
    jsi::Function&& callback,
    std::vector<jsi::Value>&& args,
    double delay) {
  // Get the id for the callback.
  TimerHandle timerID = timerIndex_++;
  timers_.emplace(
      std::piecewise_construct,
      std::forward_as_tuple(timerID),
      std::forward_as_tuple(
          std::move(callback), std::move(args), /* repeat */ false));

  platformTimerRegistry_->createTimer(timerID, delay);

  return timerID;
}

TimerHandle TimerManager::createRecurringTimer(
    jsi::Function&& callback,
    std::vector<jsi::Value>&& args,
    double delay) {
  // Get the id for the callback.
  TimerHandle timerID = timerIndex_++;
  timers_.emplace(
      std::piecewise_construct,
      std::forward_as_tuple(timerID),
      std::forward_as_tuple(
          std::move(callback), std::move(args), /* repeat */ true));

  platformTimerRegistry_->createRecurringTimer(timerID, delay);

  return timerID;
}

void TimerManager::deleteReactNativeMicrotask(
    jsi::Runtime& runtime,
    TimerHandle timerHandle) {
  if (timerHandle < 0) {
    throw jsi::JSError(
        runtime, "clearReactNativeMicrotask was called with an invalid handle");
  }

  auto it = std::find(
      reactNativeMicrotasksQueue_.begin(),
      reactNativeMicrotasksQueue_.end(),
      timerHandle);
  if (it != reactNativeMicrotasksQueue_.end()) {
    reactNativeMicrotasksQueue_.erase(it);
    timers_.erase(timerHandle);
  }
}

void TimerManager::deleteTimer(jsi::Runtime& runtime, TimerHandle timerHandle) {
  if (timerHandle < 0) {
    throw jsi::JSError(runtime, "clearTimeout called with an invalid handle");
  }

  platformTimerRegistry_->deleteTimer(timerHandle);
  timers_.erase(timerHandle);
}

void TimerManager::deleteRecurringTimer(
    jsi::Runtime& runtime,
    TimerHandle timerHandle) {
  if (timerHandle < 0) {
    throw jsi::JSError(runtime, "clearInterval called with an invalid handle");
  }

  platformTimerRegistry_->deleteTimer(timerHandle);
  timers_.erase(timerHandle);
}

void TimerManager::callTimer(TimerHandle timerHandle) {
  runtimeExecutor_([this, timerHandle](jsi::Runtime& runtime) {
    SystraceSection s("TimerManager::callTimer");
    auto it = timers_.find(timerHandle);
    if (it != timers_.end()) {
      bool repeats = it->second.repeat;
      it->second.invoke(runtime);

      if (!repeats) {
        // Invoking a timer has the potential to delete it. Do not re-use the
        // existing iterator to erase it from the map.
        timers_.erase(timerHandle);
      }
    }
  });
}

void TimerManager::attachGlobals(jsi::Runtime& runtime) {
  // Install host functions for timers.
  // TODO (T45786383): Add missing timer functions from JSTimers
  // TODO (T96212789): Remove when JSVM microtask queue is used everywhere in
  // bridgeless mode. This is being overwritten in JS in that case.
  runtime.global().setProperty(
      runtime,
      "setImmediate",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "setImmediate"),
          2, // Function, ...args
          [this](
              jsi::Runtime& rt,
              const jsi::Value& thisVal,
              const jsi::Value* args,
              size_t count) {
            if (count == 0) {
              throw jsi::JSError(
                  rt,
                  "setImmediate must be called with at least one argument (a function to call)");
            }

            if (!args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
              throw jsi::JSError(
                  rt, "The first argument to setImmediate must be a function.");
            }
            auto callback = args[0].getObject(rt).getFunction(rt);

            // Package up the remaining argument values into one place.
            std::vector<jsi::Value> moreArgs;
            for (size_t extraArgNum = 1; extraArgNum < count; extraArgNum++) {
              moreArgs.emplace_back(rt, args[extraArgNum]);
            }

            return createReactNativeMicrotask(
                std::move(callback), std::move(moreArgs));
          }));

  runtime.global().setProperty(
      runtime,
      "clearImmediate",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "clearImmediate"),
          1, // handle
          [this](
              jsi::Runtime& rt,
              const jsi::Value& thisVal,
              const jsi::Value* args,
              size_t count) {
            if (count > 0 && args[0].isNumber()) {
              auto handle = (TimerHandle)args[0].asNumber();
              deleteReactNativeMicrotask(rt, handle);
            }
            return jsi::Value::undefined();
          }));

  runtime.global().setProperty(
      runtime,
      "setTimeout",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "setTimeout"),
          3, // Function, delay, ...args
          [this](
              jsi::Runtime& rt,
              const jsi::Value& thisVal,
              const jsi::Value* args,
              size_t count) {
            if (count == 0) {
              throw jsi::JSError(
                  rt,
                  "setTimeout must be called with at least one argument (the function to call).");
            }

            if (!args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
              throw jsi::JSError(
                  rt, "The first argument to setTimeout must be a function.");
            }
            auto callback = args[0].getObject(rt).getFunction(rt);

            if (count > 1 && !args[1].isNumber() && !args[1].isUndefined()) {
              throw jsi::JSError(
                  rt,
                  "The second argument to setTimeout must be a number or undefined.");
            }
            auto delay =
                count > 1 && args[1].isNumber() ? args[1].getNumber() : 0;

            // Package up the remaining argument values into one place.
            std::vector<jsi::Value> moreArgs;
            for (size_t extraArgNum = 2; extraArgNum < count; extraArgNum++) {
              moreArgs.emplace_back(rt, args[extraArgNum]);
            }

            return createTimer(std::move(callback), std::move(moreArgs), delay);
          }));

  runtime.global().setProperty(
      runtime,
      "clearTimeout",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "clearTimeout"),
          1, // timerID
          [this](
              jsi::Runtime& rt,
              const jsi::Value& thisVal,
              const jsi::Value* args,
              size_t count) {
            if (count > 0 && args[0].isNumber()) {
              auto handle = (TimerHandle)args[0].asNumber();
              deleteTimer(rt, handle);
            }
            return jsi::Value::undefined();
          }));

  runtime.global().setProperty(
      runtime,
      "setInterval",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "setInterval"),
          3, // Function, delay, ...args
          [this](
              jsi::Runtime& rt,
              const jsi::Value& thisVal,
              const jsi::Value* args,
              size_t count) {
            if (count == 0) {
              throw jsi::JSError(
                  rt,
                  "setInterval must be called with at least one argument (the function to call).");
            }

            if (!args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
              throw jsi::JSError(
                  rt, "The first argument to setInterval must be a function.");
            }
            auto callback = args[0].getObject(rt).getFunction(rt);
            auto delay =
                count > 1 && args[1].isNumber() ? args[1].getNumber() : 0;

            // Package up the remaining argument values into one place.
            std::vector<jsi::Value> moreArgs;
            for (size_t extraArgNum = 2; extraArgNum < count; extraArgNum++) {
              moreArgs.emplace_back(rt, args[extraArgNum]);
            }

            return createRecurringTimer(
                std::move(callback), std::move(moreArgs), delay);
          }));

  runtime.global().setProperty(
      runtime,
      "clearInterval",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "clearInterval"),
          1, // timerID
          [this](
              jsi::Runtime& rt,
              const jsi::Value& thisVal,
              const jsi::Value* args,
              size_t count) {
            if (count > 0 && args[0].isNumber()) {
              auto handle = (TimerHandle)args[0].asNumber();
              deleteRecurringTimer(rt, handle);
            }
            return jsi::Value::undefined();
          }));

  runtime.global().setProperty(
      runtime,
      "requestAnimationFrame",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "requestAnimationFrame"),
          1, // callback
          [this](
              jsi::Runtime& rt,
              const jsi::Value& thisVal,
              const jsi::Value* args,
              size_t count) {
            if (count == 0) {
              throw jsi::JSError(
                  rt,
                  "requestAnimationFrame must be called with at least one argument (i.e: a callback)");
            }

            if (!args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
              throw jsi::JSError(
                  rt,
                  "The first argument to requestAnimationFrame must be a function.");
            }

            auto callback = jsi::Function::createFromHostFunction(
                rt,
                jsi::PropNameID::forAscii(rt, "RN$rafFn"),
                0,
                [callbackContainer = std::make_shared<jsi::Function>(
                     args[0].getObject(rt).getFunction(rt))](
                    jsi::Runtime& rt,
                    const jsi::Value& thisVal,
                    const jsi::Value* args,
                    size_t count) {
                  auto performance =
                      rt.global().getPropertyAsObject(rt, "performance");
                  auto nowFn = performance.getPropertyAsFunction(rt, "now");
                  auto now = nowFn.callWithThis(rt, performance, {});
                  return callbackContainer->call(rt, {std::move(now)});
                });

            // The current implementation of requestAnimationFrame is the same
            // as setTimeout(0). This isn't exactly how requestAnimationFrame
            // is supposed to work on web, and may change in the future.
            return createTimer(
                std::move(callback),
                std::vector<jsi::Value>(),
                /* delay */ 0);
          }));

  runtime.global().setProperty(
      runtime,
      "cancelAnimationFrame",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "cancelAnimationFrame"),
          1, // timerID
          [this](
              jsi::Runtime& rt,
              const jsi::Value& thisVal,
              const jsi::Value* args,
              size_t count) {
            if (count > 0 && args[0].isNumber()) {
              auto handle = (TimerHandle)args[0].asNumber();
              deleteTimer(rt, handle);
            }
            return jsi::Value::undefined();
          }));
}

} // namespace facebook::react
