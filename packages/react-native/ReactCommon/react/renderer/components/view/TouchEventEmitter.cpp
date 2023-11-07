/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TouchEventEmitter.h"

namespace facebook::react {

#pragma mark - Touches

static jsi::Value touchesPayload(
    jsi::Runtime& runtime,
    const Touches& touches) {
  auto array = jsi::Array(runtime, touches.size());
  int i = 0;
  for (const auto& touch : touches) {
    auto object = jsi::Object(runtime);
    setTouchPayloadOnObject(object, runtime, touch);
    array.setValueAtIndex(runtime, i++, object);
  }
  return array;
}

static jsi::Value touchEventPayload(
    jsi::Runtime& runtime,
    const TouchEvent& event) {
  auto object = jsi::Object(runtime);
  object.setProperty(
      runtime, "touches", touchesPayload(runtime, event.touches));
  object.setProperty(
      runtime, "changedTouches", touchesPayload(runtime, event.changedTouches));
  object.setProperty(
      runtime, "targetTouches", touchesPayload(runtime, event.targetTouches));

  if (!event.changedTouches.empty()) {
    const auto& firstChangedTouch = *event.changedTouches.begin();
    setTouchPayloadOnObject(object, runtime, firstChangedTouch);
  }
  return object;
}

void TouchEventEmitter::dispatchTouchEvent(
    std::string type,
    const TouchEvent& event,
    EventPriority priority,
    RawEvent::Category category) const {
  dispatchEvent(
      std::move(type),
      [event](jsi::Runtime& runtime) {
        return touchEventPayload(runtime, event);
      },
      priority,
      category);
}

void TouchEventEmitter::dispatchPointerEvent(
    std::string type,
    const PointerEvent& event,
    EventPriority priority,
    RawEvent::Category category) const {
  dispatchEvent(
      std::move(type),
      std::make_shared<PointerEvent>(event),
      priority,
      category);
}

void TouchEventEmitter::onTouchStart(const TouchEvent& event) const {
  dispatchTouchEvent(
      "touchStart",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onTouchMove(const TouchEvent& event) const {
  dispatchUniqueEvent("touchMove", [event](jsi::Runtime& runtime) {
    return touchEventPayload(runtime, event);
  });
}

void TouchEventEmitter::onTouchEnd(const TouchEvent& event) const {
  dispatchTouchEvent(
      "touchEnd",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onTouchCancel(const TouchEvent& event) const {
  dispatchTouchEvent(
      "touchCancel",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onClick(const PointerEvent& event) const {
  dispatchPointerEvent(
      "click",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::Discrete);
}

void TouchEventEmitter::onPointerCancel(const PointerEvent& event) const {
  dispatchPointerEvent(
      "pointerCancel",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onPointerDown(const PointerEvent& event) const {
  dispatchPointerEvent(
      "pointerDown",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onPointerMove(const PointerEvent& event) const {
  dispatchUniqueEvent("pointerMove", std::make_shared<PointerEvent>(event));
}

void TouchEventEmitter::onPointerUp(const PointerEvent& event) const {
  dispatchPointerEvent(
      "pointerUp",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onPointerEnter(const PointerEvent& event) const {
  dispatchPointerEvent(
      "pointerEnter",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onPointerLeave(const PointerEvent& event) const {
  dispatchPointerEvent(
      "pointerLeave",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onPointerOver(const PointerEvent& event) const {
  dispatchPointerEvent(
      "pointerOver",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onPointerOut(const PointerEvent& event) const {
  dispatchPointerEvent(
      "pointerOut",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onGotPointerCapture(const PointerEvent& event) const {
  dispatchPointerEvent(
      "gotPointerCapture",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onLostPointerCapture(const PointerEvent& event) const {
  dispatchPointerEvent(
      "lostPointerCapture",
      event,
      EventPriority::AsynchronousBatched,
      RawEvent::Category::ContinuousEnd);
}

} // namespace facebook::react
