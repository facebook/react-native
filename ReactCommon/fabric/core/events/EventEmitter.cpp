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

EventEmitter::EventEmitter(const InstanceHandle &instanceHandle, const Tag &tag, const SharedEventDispatcher &eventDispatcher):
  instanceHandle_(instanceHandle),
  tag_(tag),
  eventDispatcher_(eventDispatcher) {}

EventEmitter::~EventEmitter() {}

void EventEmitter::dispatchEvent(
  const std::string &type,
  const folly::dynamic &payload,
  const EventPriority &priority
) const {
  auto &&eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  EventTarget eventTarget = createEventTarget();

  // Mixing `target` into `payload`.
  assert(payload.isObject());
  folly::dynamic extendedPayload = folly::dynamic::object("target", tag_);
  extendedPayload.merge_patch(payload);

  // TODO(T29610783): Reconsider using dynamic dispatch here.
  eventDispatcher->dispatchEvent(eventTarget, type, extendedPayload, priority);
}

EventTarget EventEmitter::createEventTarget() const {
  auto &&eventDispatcher = eventDispatcher_.lock();
  assert(eventDispatcher);
  return eventDispatcher->createEventTarget(instanceHandle_);
}

} // namespace react
} // namespace facebook
