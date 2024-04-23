/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/RuntimeExecutor.h>
#include <ReactCommon/SchedulerPriority.h>

namespace facebook::react {

class PriorityCallInvoker : public CallInvoker {
 public:
  explicit PriorityCallInvoker(PriorityRuntimeExecutor priorityRuntimeExecutor);
  void invokeAsync(CallFunc&& func) noexcept override;
  void invokeAsync(SchedulerPriority priority, CallFunc&& func) noexcept
      override;
  void invokeSync(CallFunc&& func) override;

 private:
  PriorityRuntimeExecutor priorityRuntimeExecutor_;
};

} // namespace facebook::react
