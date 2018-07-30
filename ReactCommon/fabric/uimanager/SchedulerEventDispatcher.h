/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/events/EventDispatcher.h>
#include <fabric/events/primitives.h>
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

  void setUIManager(std::shared_ptr<const FabricUIManager> uiManager) const;

#pragma mark - EventDispatcher

  void dispatchEvent(
    const EventTarget &eventTarget,
    const std::string &type,
    const folly::dynamic &payload,
    const EventPriority &priority
  ) const override;


  void releaseEventTarget(const EventTarget &eventTarget) const override;

private:

  // TODO: consider using std::weak_ptr<> instead for better memory management.
  mutable std::shared_ptr<const FabricUIManager> uiManager_;
};

} // namespace react
} // namespace facebook
