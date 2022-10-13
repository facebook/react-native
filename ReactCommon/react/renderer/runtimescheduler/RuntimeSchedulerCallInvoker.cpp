/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeSchedulerCallInvoker.h"

#include <utility>

namespace facebook::react {

RuntimeSchedulerCallInvoker::RuntimeSchedulerCallInvoker(
    std::weak_ptr<RuntimeScheduler> runtimeScheduler)
    : runtimeScheduler_(std::move(runtimeScheduler)) {}

void RuntimeSchedulerCallInvoker::invokeAsync(std::function<void()> &&func) {
  if (auto runtimeScheduler = runtimeScheduler_.lock()) {
    runtimeScheduler->scheduleWork(
        [func = std::move(func)](jsi::Runtime &) { func(); });
  }
}

void RuntimeSchedulerCallInvoker::invokeSync(std::function<void()> &&func) {
  if (auto runtimeScheduler = runtimeScheduler_.lock()) {
    runtimeScheduler->executeNowOnTheSameThread(
        [func = std::move(func)](jsi::Runtime &) { func(); });
  }
}

} // namespace facebook::react
