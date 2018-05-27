/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/core/EventDispatcher.h>
#include <fabric/core/EventPrimitives.h>
#include <folly/dynamic.h>

namespace facebook {
namespace react {

/*
 * Concrete EventDispatcher.
 */
class SchedulerEventDispatcher final:
  public EventDispatcher {

public:

  void dispatchEvent(
    const InstanceHandle &instanceHandle,
    const std::string &name,
    const folly::dynamic &payload,
    const EventPriority &priority
  ) const override;
};

} // namespace react
} // namespace facebook
