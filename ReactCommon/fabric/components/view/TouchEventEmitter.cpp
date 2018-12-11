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

static jsi::Value touchPayload(jsi::Runtime &runtime, const Touch &touch) {
  auto object = jsi::Object(runtime);
  object.setProperty(runtime, "locationX", touch.offsetPoint.x);
  object.setProperty(runtime, "locationY", touch.offsetPoint.y);
  object.setProperty(runtime, "pageX", touch.pagePoint.x);
  object.setProperty(runtime, "pageY", touch.pagePoint.y);
  object.setProperty(runtime, "screenX", touch.screenPoint.x);
  object.setProperty(runtime, "screenY", touch.screenPoint.y);
  object.setProperty(runtime, "identifier", touch.identifier);
  object.setProperty(runtime, "target", touch.target);
  object.setProperty(runtime, "timestamp", touch.timestamp * 1000);
  object.setProperty(runtime, "force", touch.force);
  return object;
}

static jsi::Value touchesPayload(
    jsi::Runtime &runtime,
    const Touches &touches) {
  auto array = jsi::Array(runtime, touches.size());
  int i = 0;
  for (const auto &touch : touches) {
    array.setValueAtIndex(runtime, i++, touchPayload(runtime, touch));
  }
  return array;
}

static jsi::Value touchEventPayload(
    jsi::Runtime &runtime,
    const TouchEvent &event) {
  auto object = jsi::Object(runtime);
  object.setProperty(
      runtime, "touches", touchesPayload(runtime, event.touches));
  object.setProperty(
      runtime, "changedTouches", touchesPayload(runtime, event.changedTouches));
  object.setProperty(
      runtime, "targetTouches", touchesPayload(runtime, event.targetTouches));
  return object;
}

void TouchEventEmitter::dispatchTouchEvent(
    const std::string &type,
    const TouchEvent &event,
    const EventPriority &priority) const {
  dispatchEvent(
      type,
      [event](jsi::Runtime &runtime) {
        return touchEventPayload(runtime, event);
      },
      priority);
}

void TouchEventEmitter::onTouchStart(const TouchEvent &event) const {
  dispatchTouchEvent("touchStart", event, EventPriority::SynchronousUnbatched);
}

void TouchEventEmitter::onTouchMove(const TouchEvent &event) const {
  dispatchTouchEvent("touchMove", event, EventPriority::SynchronousBatched);
}

void TouchEventEmitter::onTouchEnd(const TouchEvent &event) const {
  dispatchTouchEvent("touchEnd", event, EventPriority::SynchronousBatched);
}

void TouchEventEmitter::onTouchCancel(const TouchEvent &event) const {
  dispatchTouchEvent("touchCancel", event, EventPriority::SynchronousBatched);
}

} // namespace react
} // namespace facebook
