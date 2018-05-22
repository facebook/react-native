/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <memory>

#include <folly/dynamic.h>
#include <fabric/core/EventDispatcher.h>
#include <fabric/core/EventPrimitives.h>
#include <fabric/core/ReactPrimitives.h>

namespace facebook {
namespace react {

class EventHandlers;

using SharedEventHandlers = std::shared_ptr<const EventHandlers>;



/*
 * Base class for all particular typed event handlers.
 * Stores `InstanceHandle` identifying a particular component and the pointer
 * to `EventDispatcher` which is responsible for delivering the event.
 *
 * TODO: Reconsider naming of all event-related things.
 */
class EventHandlers {

public:
  EventHandlers(InstanceHandle instanceHandle, SharedEventDispatcher eventDispatcher);
  virtual ~EventHandlers() = default;

protected:

  /*
   * Initates an event delivery process.
   * Is used by particular subclasses only.
   */
  void dispatchEvent(
    const std::string &name,
    const folly::dynamic &payload = {},
    const EventPriority &priority = EventPriority::AsynchronousBatched
  ) const;

private:

  InstanceHandle instanceHandle_;
  std::weak_ptr<const EventDispatcher> eventDispatcher_;
};

} // namespace react
} // namespace facebook
