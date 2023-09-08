/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeScheduler.h"

namespace facebook::react {

Task::Task(
    SchedulerPriority priority,
    jsi::Function callback,
    std::chrono::steady_clock::time_point expirationTime)
    : priority(priority),
      callback(std::move(callback)),
      expirationTime(expirationTime) {}

Task::Task(
    SchedulerPriority priority,
    RawCallback callback,
    std::chrono::steady_clock::time_point expirationTime)
    : priority(priority),
      callback(std::move(callback)),
      expirationTime(expirationTime) {}

jsi::Value Task::execute(jsi::Runtime& runtime, bool didUserCallbackTimeout) {
  auto result = jsi::Value::undefined();
  // Canceled task doesn't have a callback.
  if (!callback) {
    return result;
  }

  auto& cbVal = callback.value();

  if (cbVal.index() == 0) {
    // Callback in JavaScript is expecting a single bool parameter.
    // React team plans to remove it in the future when a scheduler bug on web
    // is resolved.
    result =
        std::get<jsi::Function>(cbVal).call(runtime, {didUserCallbackTimeout});
  } else {
    // Calling a raw callback
    std::get<RawCallback>(cbVal)(runtime);
  }
  // Destroying callback to prevent calling it twice.
  callback.reset();
  return result;
}

} // namespace facebook::react
