/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PriorityCallInvoker.h"

#include <stdexcept>

namespace facebook::react {

PriorityCallInvoker::PriorityCallInvoker(
    PriorityRuntimeExecutor priorityRuntimeExecutor)
    : priorityRuntimeExecutor_(std::move(priorityRuntimeExecutor)) {}

void PriorityCallInvoker::invokeAsync(CallFunc&& func) noexcept {
  priorityRuntimeExecutor_(
      [func = std::move(func)](jsi::Runtime& runtime) { func(runtime); },
      std::nullopt);
}

void PriorityCallInvoker::invokeAsync(
    SchedulerPriority priority,
    CallFunc&& func) noexcept {
  priorityRuntimeExecutor_(
      [func = std::move(func)](jsi::Runtime& runtime) { func(runtime); },
      priority);
}

void PriorityCallInvoker::invokeSync(CallFunc&& /*func*/) {
  // TODO: Implement this method. The TurboModule infra doesn't call invokeSync.
  throw std::runtime_error(
      "Synchronous native -> JS calls are currently not supported.");
}

} // namespace facebook::react
