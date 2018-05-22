/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SchedulerEventDispatcher.h"

namespace facebook {
namespace react {

void SchedulerEventDispatcher::dispatchEvent(
  const InstanceHandle &instanceHandle,
  const std::string &name,
  const folly::dynamic &payload,
  const EventPriority &priority
) const {
  // Some future magic here.
}

} // namespace react
} // namespace facebook
