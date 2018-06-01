/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/core/EventDispatcher.h>
#include <fabric/core/EventPrimitives.h>
#include <fabric/uimanager/FabricUIManager.h>
#include <folly/dynamic.h>

namespace facebook {
namespace react {

class SchedulerEventDispatcher;

using SharedSchedulerEventDispatcher = std::shared_ptr<const SchedulerEventDispatcher>;

/*
 * Concrete EventDispatcher.
 */
class SchedulerEventDispatcher final:
  public EventDispatcher {

public:

  void setUIManager(std::shared_ptr<const FabricUIManager> uiManager);

#pragma mark - EventDispatcher

  EventTarget createEventTarget(const InstanceHandle &instanceHandle) const override;

  void releaseEventTarget(const EventTarget &eventTarget) const override;

  void dispatchEvent(
    const EventTarget &eventTarget,
    const std::string &type,
    const folly::dynamic &payload,
    const EventPriority &priority
  ) const override;

private:

  std::shared_ptr<const FabricUIManager> uiManager_;
};

} // namespace react
} // namespace facebook
