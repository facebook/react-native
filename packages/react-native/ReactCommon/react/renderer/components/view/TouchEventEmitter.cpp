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
    TouchEvent event,
    RawEvent::Category category) const {
  dispatchEvent(
      std::move(type),
      [event = std::move(event)](jsi::Runtime& runtime) {
        return touchEventPayload(runtime, event);
      },
      category);
}

void TouchEventEmitter::dispatchPointerEvent(
    std::string type,
    PointerEvent event,
    RawEvent::Category category) const {
  dispatchEvent(
      std::move(type),
      std::make_shared<PointerEvent>(std::move(event)),
      category);
}

void TouchEventEmitter::onTouchStart(TouchEvent event) const {
  dispatchTouchEvent(
      "touchStart", std::move(event), RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onTouchMove(TouchEvent event) const {
  dispatchUniqueEvent(
      "touchMove", [event = std::move(event)](jsi::Runtime& runtime) {
        return touchEventPayload(runtime, event);
      });
}

void TouchEventEmitter::onTouchEnd(TouchEvent event) const {
  dispatchTouchEvent(
      "touchEnd", std::move(event), RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onTouchCancel(TouchEvent event) const {
  dispatchTouchEvent(
      "touchCancel", std::move(event), RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onClick(PointerEvent event) const {
  dispatchPointerEvent("click", std::move(event), RawEvent::Category::Discrete);
}

void TouchEventEmitter::onPointerCancel(PointerEvent event) const {
  dispatchPointerEvent(
      "pointerCancel", std::move(event), RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onPointerDown(PointerEvent event) const {
  dispatchPointerEvent(
      "pointerDown", std::move(event), RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onPointerMove(PointerEvent event) const {
  dispatchUniqueEvent(
      "pointerMove", std::make_shared<PointerEvent>(std::move(event)));
}

void TouchEventEmitter::onPointerUp(PointerEvent event) const {
  dispatchPointerEvent(
      "pointerUp", std::move(event), RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onPointerEnter(PointerEvent event) const {
  dispatchPointerEvent(
      "pointerEnter", std::move(event), RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onPointerLeave(PointerEvent event) const {
  dispatchPointerEvent(
      "pointerLeave", std::move(event), RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onPointerOver(PointerEvent event) const {
  dispatchPointerEvent(
      "pointerOver", std::move(event), RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onPointerOut(PointerEvent event) const {
  dispatchPointerEvent(
      "pointerOut", std::move(event), RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onGotPointerCapture(PointerEvent event) const {
  dispatchPointerEvent(
      "gotPointerCapture",
      std::move(event),
      RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onLostPointerCapture(PointerEvent event) const {
  dispatchPointerEvent(
      "lostPointerCapture",
      std::move(event),
      RawEvent::Category::ContinuousEnd);
}

} // namespace facebook::react
