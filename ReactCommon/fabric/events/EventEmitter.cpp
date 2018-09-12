/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventEmitter.h"

#include <folly/dynamic.h>

#include "RawEvent.h"

namespace facebook {
namespace react {

// TODO(T29874519): Get rid of "top" prefix once and for all.
/*
 * Capitalizes the first letter of the event type and adds "top" prefix
 * (e.g. "layout" becames "topLayout").
 */
static std::string normalizeEventType(const std::string &type) {
  auto prefixedType = type;
  prefixedType[0] = toupper(prefixedType[0]);
  prefixedType.insert(0, "top");
  return prefixedType;
}

std::recursive_mutex &EventEmitter::DispatchMutex() {
  static std::recursive_mutex mutex;
  return mutex;
}

EventEmitter::EventEmitter(const EventTarget &eventTarget, const Tag &tag, const std::shared_ptr<const EventDispatcher> &eventDispatcher):
  eventTarget_(eventTarget),
  tag_(tag),
  eventDispatcher_(eventDispatcher) {}

void EventEmitter::dispatchEvent(
  const std::string &type,
  const folly::dynamic &payload,
  const EventPriority &priority
) const {
  const auto &eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  // Mixing `target` into `payload`.
  assert(payload.isObject());
  folly::dynamic extendedPayload = folly::dynamic::object("target", tag_);
  extendedPayload.merge_patch(payload);

  auto weakEventEmitter = std::weak_ptr<const EventEmitter> {shared_from_this()};

  eventDispatcher->dispatchEvent(
    RawEvent(
      normalizeEventType(type),
      extendedPayload,
      eventTarget_,
      [weakEventEmitter]() {
        auto eventEmitter = weakEventEmitter.lock();
        if (!eventEmitter) {
          return false;
        }

        return eventEmitter->getEnabled();
      }
    ),
    priority
  );
}

void EventEmitter::setEnabled(bool enabled) const {
  enabled_ = enabled;
}

bool EventEmitter::getEnabled() const {
  return enabled_;
}

} // namespace react
} // namespace facebook
