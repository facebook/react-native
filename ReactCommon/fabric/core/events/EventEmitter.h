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
#include <fabric/core/EventDispatcher.h>
#include <fabric/core/EventPrimitives.h>
#include <fabric/core/ReactPrimitives.h>

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

public:
  EventEmitter(const InstanceHandle &instanceHandle, const Tag &tag, const SharedEventDispatcher &eventDispatcher);
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

  void createEventTargetIfNeeded() const;
  void releaseEventTargetIfNeeded() const;

  InstanceHandle instanceHandle_;
  Tag tag_;
  std::weak_ptr<const EventDispatcher> eventDispatcher_;
  mutable EventTarget eventTarget_ {nullptr};
  mutable std::mutex mutex_;
};

} // namespace react
} // namespace facebook
