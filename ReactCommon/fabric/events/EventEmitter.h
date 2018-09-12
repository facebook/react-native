/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
 */
class EventEmitter:
  public std::enable_shared_from_this<EventEmitter> {

  /*
   * We have to repeat `Tag` type definition here because `events` module does
   * not depend on `core` module (and should not).
   */
  using Tag = int32_t;

public:
  static std::recursive_mutex &DispatchMutex();

  EventEmitter(const EventTarget &eventTarget, const Tag &tag, const std::shared_ptr<const EventDispatcher> &eventDispatcher);
  virtual ~EventEmitter() = default;

  /*
   * Indicates that an event can be delivered to `eventTarget`.
   * Callsite must acquire `DispatchMutex` to access those methods.
   */
  void setEnabled(bool enabled) const;
  bool getEnabled() const;

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
  EventTarget eventTarget_;
  Tag tag_;
  std::weak_ptr<const EventDispatcher> eventDispatcher_;
  mutable bool enabled_; // Protected by `DispatchMutex`.
};

} // namespace react
} // namespace facebook
