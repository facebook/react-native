/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TouchEventEmitter.h"

namespace facebook {
namespace react {

#pragma mark - Touches

static folly::dynamic touchPayload(const Touch &touch) {
  folly::dynamic object = folly::dynamic::object();
  object["locationX"] = touch.offsetPoint.x;
  object["locationY"] = touch.offsetPoint.y;
  object["pageX"] = touch.pagePoint.x;
  object["pageY"] = touch.pagePoint.y;
  object["screenX"] = touch.screenPoint.x;
  object["screenY"] = touch.screenPoint.y;
  object["identifier"] = touch.identifier;
  object["target"] = touch.target;
  object["timestamp"] = touch.timestamp * 1000;
  object["force"] = touch.force;
  return object;
}

static folly::dynamic touchesPayload(const Touches &touches) {
  folly::dynamic array = folly::dynamic::array();
  for (const auto &touch : touches) {
    array.push_back(touchPayload(touch));
  }
  return array;
}

static folly::dynamic touchEventPayload(const TouchEvent &event) {
  folly::dynamic object = folly::dynamic::object();
  object["touches"] = touchesPayload(event.touches);
  object["changedTouches"] = touchesPayload(event.changedTouches);
  object["targetTouches"] = touchesPayload(event.targetTouches);
  return object;
}

void TouchEventEmitter::onTouchStart(const TouchEvent &event) const {
  dispatchEvent(
      "touchStart",
      touchEventPayload(event),
      EventPriority::SynchronousUnbatched);
}

void TouchEventEmitter::onTouchMove(const TouchEvent &event) const {
  dispatchEvent(
      "touchMove", touchEventPayload(event), EventPriority::SynchronousBatched);
}

void TouchEventEmitter::onTouchEnd(const TouchEvent &event) const {
  dispatchEvent(
      "touchEnd", touchEventPayload(event), EventPriority::SynchronousBatched);
}

void TouchEventEmitter::onTouchCancel(const TouchEvent &event) const {
  dispatchEvent(
      "touchCancel",
      touchEventPayload(event),
      EventPriority::SynchronousBatched);
}

} // namespace react
} // namespace facebook
