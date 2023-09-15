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

std::shared_ptr<TimerHandle> TimerManager::createReactNativeMicrotask(
    jsi::Function&& callback,
    std::vector<jsi::Value>&& args) {
  auto sharedCallback = std::make_shared<TimerCallback>(
      std::move(callback), std::move(args), /* repeat */ false);

  // Get the id for the callback.
  uint32_t timerID = timerIndex_++;
  timers_[timerID] = std::move(sharedCallback);

  reactNativeMicrotasksQueue_.push_back(timerID);
  return std::make_shared<TimerHandle>(timerID);
}

void TimerManager::callReactNativeMicrotasks(jsi::Runtime& runtime) {
  std::vector<uint32_t> reactNativeMicrotasksQueue;
  while (!reactNativeMicrotasksQueue_.empty()) {
    reactNativeMicrotasksQueue.clear();
    reactNativeMicrotasksQueue.swap(reactNativeMicrotasksQueue_);

    for (auto reactNativeMicrotaskID : reactNativeMicrotasksQueue) {
      // ReactNativeMicrotasks can clear other scheduled reactNativeMicrotasks.
      if (timers_.count(reactNativeMicrotaskID) > 0) {
        timers_[reactNativeMicrotaskID]->invoke(runtime);
        timers_.erase(reactNativeMicrotaskID);
      }
    }
  }
}

std::shared_ptr<TimerHandle> TimerManager::createTimer(
    jsi::Function&& callback,
    std::vector<jsi::Value>&& args,
    double delay) {
  auto sharedCallback = std::make_shared<TimerCallback>(
      std::move(callback), std::move(args), false);

  // Get the id for the callback.
  uint32_t timerID = timerIndex_++;
  timers_[timerID] = std::move(sharedCallback);

  platformTimerRegistry_->createTimer(timerID, delay);

  return std::make_shared<TimerHandle>(timerID);
}

std::shared_ptr<TimerHandle> TimerManager::createRecurringTimer(
    jsi::Function&& callback,
    std::vector<jsi::Value>&& args,
    double delay) {
  auto sharedCallback = std::make_shared<TimerCallback>(
      std::move(callback), std::move(args), true);

  // Get the id for the callback.
  uint32_t timerID = timerIndex_++;
  timers_[timerID] = std::move(sharedCallback);

  platformTimerRegistry_->createRecurringTimer(timerID, delay);

  return std::make_shared<TimerHandle>(timerID);
}

void TimerManager::deleteReactNativeMicrotask(
    jsi::Runtime& runtime,
    std::shared_ptr<TimerHandle> timerHandle) {
  if (timerHandle == nullptr) {
    throw jsi::JSError(
        runtime, "clearReactNativeMicrotask was called with an invalid handle");
  }

  for (auto it = reactNativeMicrotasksQueue_.begin();
       it != reactNativeMicrotasksQueue_.end();
       it++) {
    if ((*it) == timerHandle->index()) {
      reactNativeMicrotasksQueue_.erase(it);
      break;
    }
  }

  if (timers_.find(timerHandle->index()) != timers_.end()) {
    timers_.erase(timerHandle->index());
  }
}

void TimerManager::deleteTimer(
    jsi::Runtime& runtime,
    std::shared_ptr<TimerHandle> timerHandle) {
  if (timerHandle == nullptr) {
    throw jsi::JSError(runtime, "clearTimeout called with an invalid handle");
  }

  platformTimerRegistry_->deleteTimer(timerHandle->index());
  if (timers_.find(timerHandle->index()) != timers_.end()) {
    timers_.erase(timerHandle->index());
  }
}

void TimerManager::deleteRecurringTimer(
    jsi::Runtime& runtime,
    std::shared_ptr<TimerHandle> timerHandle) {
  if (timerHandle == nullptr) {
    throw jsi::JSError(runtime, "clearInterval called with an invalid handle");
  }

  platformTimerRegistry_->deleteTimer(timerHandle->index());
  if (timers_.find(timerHandle->index()) != timers_.end()) {
    timers_.erase(timerHandle->index());
  }
}

void TimerManager::callTimer(uint32_t timerID) {
  runtimeExecutor_([this, timerID](jsi::Runtime& runtime) {
    SystraceSection s("TimerManager::callTimer");
    if (timers_.count(timerID) > 0) {
      timers_[timerID]->invoke(runtime);
      // Invoking a timer has the potential to delete it. Double check the timer
      // still exists before accessing it again.
      if (timers_.count(timerID) > 0 && !timers_[timerID]->repeat) {
        timers_.erase(timerID);
      }
    }
  });
}

void TimerManager::attachGlobals(jsi::Runtime& runtime) {
  // Install host functions for timers.
  // TODO (T45786383): Add missing timer functions from JSTimers
  // TODL (T96212789): Skip immediate APIs when JSVM microtask queue is used.
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

            auto handle = createReactNativeMicrotask(
                std::move(callback), std::move(moreArgs));
            return jsi::Object::createFromHostObject(rt, handle);
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
            if (count == 0 || !args[0].isObject() ||
                !args[0].asObject(rt).isHostObject<TimerHandle>(rt)) {
              return jsi::Value::undefined();
            }
            std::shared_ptr<TimerHandle> handle =
                args[0].asObject(rt).asHostObject<TimerHandle>(rt);
            deleteReactNativeMicrotask(rt, handle);
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

            auto handle =
                createTimer(std::move(callback), std::move(moreArgs), delay);
            return jsi::Object::createFromHostObject(rt, handle);
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
            if (count == 0 || !args[0].isObject() ||
                !args[0].asObject(rt).isHostObject<TimerHandle>(rt)) {
              return jsi::Value::undefined();
            }
            std::shared_ptr<TimerHandle> host =
                args[0].asObject(rt).asHostObject<TimerHandle>(rt);
            deleteTimer(rt, host);
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
            if (count < 2) {
              throw jsi::JSError(
                  rt,
                  "setInterval must be called with at least two arguments (the function to call and the delay).");
            }

            if (!args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
              throw jsi::JSError(
                  rt, "The first argument to setInterval must be a function.");
            }
            auto callback = args[0].getObject(rt).getFunction(rt);

            if (!args[1].isNumber()) {
              throw jsi::JSError(
                  rt, "The second argument to setInterval must be a number.");
            }
            auto delay = args[1].getNumber();

            // Package up the remaining argument values into one place.
            std::vector<jsi::Value> moreArgs;
            for (size_t extraArgNum = 2; extraArgNum < count; extraArgNum++) {
              moreArgs.emplace_back(rt, args[extraArgNum]);
            }

            auto handle = createRecurringTimer(
                std::move(callback), std::move(moreArgs), delay);
            return jsi::Object::createFromHostObject(rt, handle);
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
            if (count == 0 || !args[0].isObject() ||
                !args[0].asObject(rt).isHostObject<TimerHandle>(rt)) {
              return jsi::Value::undefined();
            }
            std::shared_ptr<TimerHandle> host =
                args[0].asObject(rt).asHostObject<TimerHandle>(rt);
            deleteRecurringTimer(rt, host);
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

            using CallbackContainer = std::tuple<jsi::Function>;
            auto callback = jsi::Function::createFromHostFunction(
                rt,
                jsi::PropNameID::forAscii(rt, "RN$rafFn"),
                0,
                [callbackContainer = std::make_shared<CallbackContainer>(
                     args[0].getObject(rt).getFunction(rt))](
                    jsi::Runtime& rt,
                    const jsi::Value& thisVal,
                    const jsi::Value* args,
                    size_t count) {
                  auto performance =
                      rt.global().getPropertyAsObject(rt, "performance");
                  auto nowFn = performance.getPropertyAsFunction(rt, "now");
                  auto now = nowFn.callWithThis(rt, performance, {});

                  return std::get<0>(*callbackContainer)
                      .call(rt, {std::move(now)});
                });

            // The current implementation of requestAnimationFrame is the same
            // as setTimeout(0). This isn't exactly how requestAnimationFrame
            // is supposed to work on web, and may change in the future.
            auto handle = createTimer(
                std::move(callback),
                std::vector<jsi::Value>(),
                /* delay */ 0);
            return jsi::Object::createFromHostObject(rt, handle);
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
            if (count == 0 || !args[0].isObject() ||
                !args[0].asObject(rt).isHostObject<TimerHandle>(rt)) {
              return jsi::Value::undefined();
            }
            std::shared_ptr<TimerHandle> host =
                args[0].asObject(rt).asHostObject<TimerHandle>(rt);
            deleteTimer(rt, host);
            return jsi::Value::undefined();
          }));
}

} // namespace facebook::react
