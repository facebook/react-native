/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventEmitter.h"

#include <folly/dynamic.h>
#include <react/debug/SystraceSection.h>

#include "RawEvent.h"

namespace facebook {
namespace react {

// TODO(T29874519): Get rid of "top" prefix once and for all.
/*
 * Capitalizes the first letter of the event type and adds "top" prefix if
 * necessary (e.g. "layout" becames "topLayout").
 */
static std::string normalizeEventType(const std::string &type) {
  auto prefixedType = type;
  if (type.find("top", 0) != 0) {
    prefixedType.insert(0, "top");
    prefixedType[3] = toupper(prefixedType[3]);
  }
  return prefixedType;
}

std::recursive_mutex &EventEmitter::DispatchMutex() {
  static std::recursive_mutex mutex;
  return mutex;
}

EventEmitter::EventEmitter(
    SharedEventTarget eventTarget,
    Tag tag,
    WeakEventDispatcher eventDispatcher)
    : eventTarget_(std::move(eventTarget)),
      weakEventTarget_({}),
      tag_(tag),
      eventDispatcher_(std::move(eventDispatcher)) {}

void EventEmitter::dispatchEvent(
    const std::string &type,
    const folly::dynamic &payload,
    const EventPriority &priority) const {
  SystraceSection s("EventEmitter::dispatchEvent");
  auto eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  // Mixing `target` into `payload`.
  assert(payload.isObject());
  folly::dynamic extendedPayload = folly::dynamic::object("target", tag_);
  extendedPayload.merge_patch(payload);

  eventDispatcher->dispatchEvent(
      RawEvent(normalizeEventType(type), extendedPayload, eventTarget_),
      priority);
}

void EventEmitter::enable() const {
  enableCounter_++;
  toggleEventTargetOwnership_();
}

void EventEmitter::disable() const {
  enableCounter_--;
  toggleEventTargetOwnership_();
}

void EventEmitter::toggleEventTargetOwnership_() const {
  bool shouldBeRetained = enableCounter_ > 0;
  bool alreadyBeRetained = eventTarget_ != nullptr;
  if (shouldBeRetained == alreadyBeRetained) {
    return;
  }

  if (shouldBeRetained) {
    eventTarget_ = weakEventTarget_.lock();
    weakEventTarget_.reset();
  } else {
    weakEventTarget_ = eventTarget_;
    eventTarget_.reset();
  }
}

} // namespace react
} // namespace facebook
