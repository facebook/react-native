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

jsi::Value Task::execute(jsi::Runtime &runtime, bool didUserCallbackTimeout) {
  auto result = jsi::Value::undefined();
  // Cancelled task doesn't have a callback.
  if (callback) {
    // Callback in JavaScript is expecting a single bool parameter.
    // React team plans to remove it in the future when a scheduler bug on web
    // is resolved.
    result = callback.value().call(runtime, {didUserCallbackTimeout});

    // Destroying callback to prevent calling it twice.
    callback.reset();
  }
  return result;
}

} // namespace facebook::react
