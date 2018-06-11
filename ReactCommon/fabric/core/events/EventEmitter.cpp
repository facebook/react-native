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

EventEmitter::~EventEmitter() {
  releaseEventTargetIfNeeded();
}

void EventEmitter::dispatchEvent(
  const std::string &type,
  const folly::dynamic &payload,
  const EventPriority &priority
) const {
  auto &&eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  createEventTargetIfNeeded();

  // Mixing `target` into `payload`.
  assert(payload.isObject());
  folly::dynamic extendedPayload = folly::dynamic::object("target", tag_);
  extendedPayload.merge_patch(payload);

  // TODO(T29610783): Reconsider using dynamic dispatch here.
  eventDispatcher->dispatchEvent(eventTarget_, type, extendedPayload, priority);
}

void EventEmitter::createEventTargetIfNeeded() const {
  std::lock_guard<std::mutex> lock(mutex_);

  if (eventTarget_) {
    return;
  }

  auto &&eventDispatcher = eventDispatcher_.lock();
  assert(eventDispatcher);
  eventTarget_ = eventDispatcher->createEventTarget(instanceHandle_);
}

void EventEmitter::releaseEventTargetIfNeeded() const {
  std::lock_guard<std::mutex> lock(mutex_);

  if (!eventTarget_) {
    return;
  }

  auto &&eventDispatcher = eventDispatcher_.lock();
  assert(eventDispatcher);
  eventDispatcher->releaseEventTarget(eventTarget_);
}

} // namespace react
} // namespace facebook
