/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SchedulerEventDispatcher.h"

namespace facebook {
namespace react {

// TODO(T29874519): Get rid of "top" prefix once and for all.
/*
 * Capitalizes the first letter of the event type and adds "top" prefix
 * (e.g. "layout" becames "topLayout").
 */
static std::string normalizeEventType(const std::string &type) {
  std::string prefixedType = type;
  prefixedType[0] = toupper(prefixedType[0]);
  prefixedType.insert(0, "top");
  return prefixedType;
}

void SchedulerEventDispatcher::setUIManager(std::shared_ptr<const FabricUIManager> uiManager) const {
  uiManager_ = uiManager;
}

void SchedulerEventDispatcher::dispatchEvent(
  const EventTarget &eventTarget,
  const std::string &type,
  const folly::dynamic &payload,
  const EventPriority &priority
) const {
  if (!uiManager_) {
    return;
  }
  // TODO: Schedule the event based on priority.
  uiManager_->dispatchEventToTarget(eventTarget, normalizeEventType(type), payload);
}

void SchedulerEventDispatcher::releaseEventTarget(const EventTarget &eventTarget) const {
  if (!uiManager_) {
    return;
  }
  // TODO(shergin): This needs to move to the destructor of EventEmitter. For now we'll leak.
  // uiManager_->releaseEventTarget(eventTarget);
}

} // namespace react
} // namespace facebook
