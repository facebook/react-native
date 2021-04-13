/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook::react {

enum class SchedulerPriority : int {
  ImmediatePriority = 1,
  UserBlockingPriority = 2,
  NormalPriority = 3,
  LowPriority = 4,
  IdlePriority = 5,
};

static constexpr std::underlying_type<SchedulerPriority>::type serialize(
    SchedulerPriority schedulerPriority) {
  return static_cast<std::underlying_type<SchedulerPriority>::type>(
      schedulerPriority);
}

} // namespace facebook::react
