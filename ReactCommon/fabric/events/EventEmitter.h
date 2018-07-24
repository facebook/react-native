/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <memory>
#include <mutex>

#include <folly/dynamic.h>
#include <fabric/events/EventDispatcher.h>
#include <fabric/events/primitives.h>

namespace facebook {
namespace react {

class EventEmitter;

using SharedEventEmitter = std::shared_ptr<const EventEmitter>;

/*
 * Base class for all particular typed event handlers.
 * Stores `InstanceHandle` identifying a particular component and the pointer
 * to `EventDispatcher` which is responsible for delivering the event.
 *
 * TODO: Reconsider naming of all event-related things.
 */
class EventEmitter {

  /*
   * We have to repeat `Tag` type definition here because `events` module does
   * not depend on `core` module (and should not).
   */
  using Tag = int32_t;

public:
  EventEmitter(const EventTarget &eventTarget, const Tag &tag, const SharedEventDispatcher &eventDispatcher);
  virtual ~EventEmitter();

protected:

  /*
   * Initates an event delivery process.
   * Is used by particular subclasses only.
   */
  void dispatchEvent(
    const std::string &type,
    const folly::dynamic &payload = folly::dynamic::object(),
    const EventPriority &priority = EventPriority::AsynchronousBatched
  ) const;

private:

  mutable EventTarget eventTarget_ {nullptr};
  Tag tag_;
  std::weak_ptr<const EventDispatcher> eventDispatcher_;
};

} // namespace react
} // namespace facebook
