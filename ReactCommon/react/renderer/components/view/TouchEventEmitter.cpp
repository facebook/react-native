/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TouchEventEmitter.h"

namespace facebook::react {

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
  // x/y are an alias to clientX/Y
  object.setProperty(runtime, "x", event.clientPoint.x);
  object.setProperty(runtime, "y", event.clientPoint.y);
  // since RN doesn't have a scrollable root, pageX/Y will always equal
  // clientX/Y
  object.setProperty(runtime, "pageX", event.clientPoint.x);
  object.setProperty(runtime, "pageY", event.clientPoint.y);
  object.setProperty(runtime, "screenX", event.screenPoint.x);
  object.setProperty(runtime, "screenY", event.screenPoint.y);
  object.setProperty(runtime, "offsetX", event.offsetPoint.x);
  object.setProperty(runtime, "offsetY", event.offsetPoint.y);
  object.setProperty(runtime, "width", event.width);
  object.setProperty(runtime, "height", event.height);
  object.setProperty(runtime, "tiltX", event.tiltX);
  object.setProperty(runtime, "tiltY", event.tiltY);
  object.setProperty(runtime, "detail", event.detail);
  object.setProperty(runtime, "buttons", event.buttons);
  object.setProperty(runtime, "tangentialPressure", event.tangentialPressure);
  object.setProperty(runtime, "twist", event.twist);
  object.setProperty(runtime, "ctrlKey", event.ctrlKey);
  object.setProperty(runtime, "shiftKey", event.shiftKey);
  object.setProperty(runtime, "altKey", event.altKey);
  object.setProperty(runtime, "metaKey", event.metaKey);
  object.setProperty(runtime, "isPrimary", event.isPrimary);
  object.setProperty(runtime, "button", event.button);
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

void TouchEventEmitter::onPointerMove(const PointerEvent &event) const {
  dispatchUniqueEvent("pointerMove", [event](jsi::Runtime &runtime) {
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

void TouchEventEmitter::onPointerEnter(const PointerEvent &event) const {
  dispatchPointerEvent(
      "pointerEnter",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onPointerLeave(const PointerEvent &event) const {
  dispatchPointerEvent(
      "pointerLeave",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onPointerOver(const PointerEvent &event) const {
  dispatchPointerEvent(
      "pointerOver",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onPointerOut(const PointerEvent &event) const {
  dispatchPointerEvent(
      "pointerOut",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousStart);
}

} // namespace facebook::react
