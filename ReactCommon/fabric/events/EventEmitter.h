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
#include <react/events/EventDispatcher.h>
#include <react/events/primitives.h>

namespace facebook {
namespace react {

class EventEmitter;

using SharedEventEmitter = std::shared_ptr<const EventEmitter>;

/*
 * Base class for all particular typed event handlers.
 * Stores a pointer to `EventTarget` identifying a particular component and
 * a weak pointer to `EventDispatcher` which is responsible for delivering the
 * event.
 *
 * Note: Retaining an `EventTarget` does *not* guarantee that actual event
 * target exists and/or valid in JavaScript realm. The `EventTarget` retains an
 * `EventTargetWrapper` which wraps JavaScript object in `unsafe-unretained`
 * manner. Retaining the `EventTarget` *does* indicate that we can use that to
 * get an actual JavaScript object from that in the future *ensuring safety
 * beforehand somehow*; JSI maintains `WeakObject` object as long as we retain
 * the `EventTarget`. All `EventTarget` instances must be deallocated before
 * stopping JavaScript machine.
 */
class EventEmitter {
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
      WeakEventDispatcher eventDispatcher);

  virtual ~EventEmitter() = default;

  /*
   * `DispatchMutex` must be acquired before calling.
   * Enables/disables event emitter.
   * Enabled event emitter retains a pointer to `eventTarget` strongly (as
   * `std::shared_ptr`) whereas disabled one weakly (as `std::weak_ptr`).
   * The enable state is additive; a number of `enable` calls should be equal to
   * a number of `disable` calls to release the event target.
   */
  void enable() const;
  void disable() const;

 protected:
#ifdef ANDROID
  // We need this temporarily due to lack of Java-counterparts for particular
  // subclasses.
 public:
#endif

  /*
   * Initates an event delivery process.
   * Is used by particular subclasses only.
   */
  void dispatchEvent(
      const std::string &type,
      const folly::dynamic &payload = folly::dynamic::object(),
      const EventPriority &priority = EventPriority::AsynchronousBatched) const;

 private:
  void toggleEventTargetOwnership_() const;

  mutable SharedEventTarget eventTarget_;
  mutable WeakEventTarget weakEventTarget_;
  Tag tag_;
  WeakEventDispatcher eventDispatcher_;
  mutable int enableCounter_{0};
};

} // namespace react
} // namespace facebook
