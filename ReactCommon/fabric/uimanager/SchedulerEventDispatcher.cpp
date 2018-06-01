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

void SchedulerEventDispatcher::setUIManager(std::shared_ptr<const FabricUIManager> uiManager) {
  uiManager_ = uiManager;
}

EventTarget SchedulerEventDispatcher::createEventTarget(const InstanceHandle &instanceHandle) const {
  return uiManager_->createEventTarget(instanceHandle);
}

void SchedulerEventDispatcher::releaseEventTarget(const EventTarget &eventTarget) const {
  uiManager_->releaseEventTarget(eventTarget);
}

void SchedulerEventDispatcher::dispatchEvent(
  const EventTarget &eventTarget,
  const std::string &type,
  const folly::dynamic &payload,
  const EventPriority &priority
) const {
  uiManager_->dispatchEvent(eventTarget, normalizeEventType(type), payload);
}

} // namespace react
} // namespace facebook
