/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventEmitter.h"

#include <folly/dynamic.h>

namespace facebook {
namespace react {

EventEmitter::EventEmitter(const EventTarget &eventTarget, const Tag &tag, const SharedEventDispatcher &eventDispatcher):
  eventTarget_(eventTarget),
  tag_(tag),
  eventDispatcher_(eventDispatcher) {
}

EventEmitter::~EventEmitter() {
  auto &&eventDispatcher = eventDispatcher_.lock();
  if (eventDispatcher && eventTarget_) {
    eventDispatcher->releaseEventTarget(eventTarget_);
  }
}

void EventEmitter::dispatchEvent(
  const std::string &type,
  const folly::dynamic &payload,
  const EventPriority &priority
) const {
  const auto &eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  assert(eventTarget_ && "Attempted to dispatch an event without an eventTarget.");

  // Mixing `target` into `payload`.
  assert(payload.isObject());
  folly::dynamic extendedPayload = folly::dynamic::object("target", tag_);
  extendedPayload.merge_patch(payload);

  // TODO(T29610783): Reconsider using dynamic dispatch here.
  eventDispatcher->dispatchEvent(eventTarget_, type, extendedPayload, priority);
}

} // namespace react
} // namespace facebook
