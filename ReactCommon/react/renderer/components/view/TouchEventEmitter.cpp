/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TouchEventEmitter.h"

namespace facebook {
namespace react {

#pragma mark - Touches

static void setTouchPayloadOnObject(
    jsi::Object &object,
    jsi::Runtime &runtime,
    Touch const &touch) {
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
}

static jsi::Value touchesPayload(
    jsi::Runtime &runtime,
    Touches const &touches) {
  auto array = jsi::Array(runtime, touches.size());
  int i = 0;
  for (auto const &touch : touches) {
    auto object = jsi::Object(runtime);
    setTouchPayloadOnObject(object, runtime, touch);
    array.setValueAtIndex(runtime, i++, object);
  }
  return array;
}

static jsi::Value touchEventPayload(
    jsi::Runtime &runtime,
    TouchEvent const &event) {
  auto object = jsi::Object(runtime);
  object.setProperty(
      runtime, "touches", touchesPayload(runtime, event.touches));
  object.setProperty(
      runtime, "changedTouches", touchesPayload(runtime, event.changedTouches));
  object.setProperty(
      runtime, "targetTouches", touchesPayload(runtime, event.targetTouches));

  if (!event.changedTouches.empty()) {
    auto const &firstChangedTouch = *event.changedTouches.begin();
    setTouchPayloadOnObject(object, runtime, firstChangedTouch);
  }
  return object;
}

static jsi::Value pointerEventPayload(
    jsi::Runtime &runtime,
    PointerEvent const &event) {
  auto object = jsi::Object(runtime);
  object.setProperty(runtime, "pointerId", event.pointerId);
  object.setProperty(runtime, "pressure", event.pressure);
  object.setProperty(runtime, "pointerType", event.pointerType);
  object.setProperty(runtime, "clientX", event.clientPoint.x);
  object.setProperty(runtime, "clientY", event.clientPoint.y);
  object.setProperty(runtime, "target", event.target);
  object.setProperty(runtime, "timestamp", event.timestamp * 1000);
  return object;
}

void TouchEventEmitter::dispatchTouchEvent(
    std::string type,
    TouchEvent const &event,
    EventPriority priority,
    RawEvent::Category category) const {
  dispatchEvent(
      std::move(type),
      [event](jsi::Runtime &runtime) {
        return touchEventPayload(runtime, event);
      },
      priority,
      category);
}

void TouchEventEmitter::dispatchPointerEvent(
    std::string type,
    PointerEvent const &event,
    EventPriority priority,
    RawEvent::Category category) const {
  dispatchEvent(
      std::move(type),
      [event](jsi::Runtime &runtime) {
        return pointerEventPayload(runtime, event);
      },
      priority,
      category);
}

void TouchEventEmitter::onTouchStart(TouchEvent const &event) const {
  dispatchTouchEvent(
      "touchStart",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onTouchMove(TouchEvent const &event) const {
  dispatchUniqueEvent("touchMove", [event](jsi::Runtime &runtime) {
    return touchEventPayload(runtime, event);
  });
}

void TouchEventEmitter::onTouchEnd(TouchEvent const &event) const {
  dispatchTouchEvent(
      "touchEnd",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onTouchCancel(TouchEvent const &event) const {
  dispatchTouchEvent(
      "touchCancel",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onPointerCancel(const PointerEvent &event) const {
  dispatchPointerEvent(
      "pointerCancel",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onPointerDown(const PointerEvent &event) const {
  dispatchPointerEvent(
      "pointerDown",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onPointerMove2(const PointerEvent &event) const {
  dispatchUniqueEvent("pointerMove2", [event](jsi::Runtime &runtime) {
    return pointerEventPayload(runtime, event);
  });
}

void TouchEventEmitter::onPointerUp(const PointerEvent &event) const {
  dispatchPointerEvent(
      "pointerUp",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onPointerEnter2(const PointerEvent &event) const {
  dispatchPointerEvent(
      "pointerEnter2",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onPointerLeave2(const PointerEvent &event) const {
  dispatchPointerEvent(
      "pointerLeave2",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousEnd);
}

} // namespace react
} // namespace facebook
