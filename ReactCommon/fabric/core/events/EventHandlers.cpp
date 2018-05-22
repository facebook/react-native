/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventHandlers.h"

#include <folly/dynamic.h>

namespace facebook {
namespace react {

EventHandlers::EventHandlers(InstanceHandle instanceHandle, SharedEventDispatcher eventDispatcher):
  instanceHandle_(instanceHandle),
  eventDispatcher_(eventDispatcher) {}

void EventHandlers::dispatchEvent(
  const std::string &name,
  const folly::dynamic &payload,
  const EventPriority &priority
) const {
  auto &&eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  // TODO(T29610783): Reconsider using dynamic dispatch here.
  eventDispatcher->dispatchEvent(instanceHandle_, name, payload, priority);
}

} // namespace react
} // namespace facebook
