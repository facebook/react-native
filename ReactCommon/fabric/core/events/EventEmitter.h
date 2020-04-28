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
#include <react/core/EventDispatcher.h>
#include <react/core/EventPriority.h>
#include <react/core/EventTarget.h>

namespace facebook {
namespace react {

class EventEmitter;

using SharedEventEmitter = std::shared_ptr<const EventEmitter>;

/*
 * Base class for all particular typed event handlers.
 * Stores a pointer to `EventTarget` identifying a particular component and
 * a weak pointer to `EventDispatcher` which is responsible for delivering the
 * event.
 */
class EventEmitter {
  /*
   * We have to repeat `Tag` type definition here because `events` module does
   * not depend on `core` module (and should not).
   */
  using Tag = int32_t;

 public:
  using Shared = std::shared_ptr<EventEmitter const>;

  static std::mutex &DispatchMutex();

  static ValueFactory defaultPayloadFactory();

  EventEmitter(
      SharedEventTarget eventTarget,
      Tag tag,
      EventDispatcher::Weak eventDispatcher);

  virtual ~EventEmitter() = default;

  /*
   * Enables/disables event emitter.
   * Enabled event emitter retains a pointer to `eventTarget` strongly (as
   * `std::shared_ptr`) whereas disabled one don't.
   * Enabled/disabled state is also proxied to `eventTarget` where it indicates
   * a possibility to extract JSI value from it.
   * The enable state is additive; a number of `enable` calls should be equal to
   * a number of `disable` calls to release the event target.
   * `DispatchMutex` must be acquired before calling.
   */
  void setEnabled(bool enabled) const;

 protected:
#ifdef ANDROID
  // We need this temporarily due to lack of Java-counterparts for particular
  // subclasses.
 public:
#endif

  /*
   * Initiates an event delivery process.
   * Is used by particular subclasses only.
   */
  void dispatchEvent(
      const std::string &type,
      const ValueFactory &payloadFactory =
          EventEmitter::defaultPayloadFactory(),
      const EventPriority &priority = EventPriority::AsynchronousBatched) const;

  void dispatchEvent(
      const std::string &type,
      const folly::dynamic &payload,
      const EventPriority &priority = EventPriority::AsynchronousBatched) const;

 private:
  void toggleEventTargetOwnership_() const;

  mutable SharedEventTarget eventTarget_;
  EventDispatcher::Weak eventDispatcher_;
  mutable int enableCounter_{0};
  mutable bool isEnabled_{false};
};

} // namespace react
} // namespace facebook
