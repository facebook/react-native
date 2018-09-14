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
 * Stores a pointer to `EventTarget` identifying a particular component and
 * a weak pointer to `EventDispatcher` which is responsible for delivering the event.
 *
 * Note: Retaining an `EventTarget` does *not* guarantee that actual event target
 * exists and/or valid in JavaScript realm. The `EventTarget` retains an `EventTargetWrapper`
 * which wraps JavaScript object in `unsafe-unretained` manner. Retaining
 * the `EventTarget` *does* indicate that we can use that to get an actual
 * JavaScript object from that in the future *ensuring safety beforehand somehow*;
 * JSI maintains `WeakObject` object as long as we retain the `EventTarget`.
 * All `EventTarget` instances must be deallocated before stopping JavaScript machine.
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

  EventEmitter(
    SharedEventTarget eventTarget,
    Tag tag,
    WeakEventDispatcher eventDispatcher
  );

  virtual ~EventEmitter() = default;

  /*
   * Indicates that an event can be delivered to `eventTarget`.
   * Callsite must acquire `DispatchMutex` to access those methods.
   * The `setEnabled` operation is not guaranteed: the `EventEmitter` cannot
   * be re-enabled after disabling; in this case, the method does nothing.
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
  mutable SharedEventTarget eventTarget_;
  Tag tag_;
  WeakEventDispatcher eventDispatcher_;
};

} // namespace react
} // namespace facebook
