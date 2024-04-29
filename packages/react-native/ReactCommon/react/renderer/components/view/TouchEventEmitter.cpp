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
    RawEvent::Category category) const {
  dispatchEvent(
      std::move(type),
      [event](jsi::Runtime& runtime) {
        return touchEventPayload(runtime, event);
      },
      category);
}

void TouchEventEmitter::dispatchPointerEvent(
    std::string type,
    const PointerEvent& event,
    RawEvent::Category category) const {
  dispatchEvent(
      std::move(type), std::make_shared<PointerEvent>(event), category);
}

void TouchEventEmitter::onTouchStart(const TouchEvent& event) const {
  dispatchTouchEvent("touchStart", event, RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onTouchMove(const TouchEvent& event) const {
  dispatchUniqueEvent("touchMove", [event](jsi::Runtime& runtime) {
    return touchEventPayload(runtime, event);
  });
}

void TouchEventEmitter::onTouchEnd(const TouchEvent& event) const {
  dispatchTouchEvent("touchEnd", event, RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onTouchCancel(const TouchEvent& event) const {
  dispatchTouchEvent("touchCancel", event, RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onClick(const PointerEvent& event) const {
  dispatchPointerEvent("click", event, RawEvent::Category::Discrete);
}

void TouchEventEmitter::onPointerCancel(const PointerEvent& event) const {
  dispatchPointerEvent(
      "pointerCancel", event, RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onPointerDown(const PointerEvent& event) const {
  dispatchPointerEvent(
      "pointerDown", event, RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onPointerMove(const PointerEvent& event) const {
  dispatchUniqueEvent("pointerMove", std::make_shared<PointerEvent>(event));
}

void TouchEventEmitter::onPointerUp(const PointerEvent& event) const {
  dispatchPointerEvent("pointerUp", event, RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onPointerEnter(const PointerEvent& event) const {
  dispatchPointerEvent(
      "pointerEnter", event, RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onPointerLeave(const PointerEvent& event) const {
  dispatchPointerEvent(
      "pointerLeave", event, RawEvent::Category::ContinuousEnd);
}

void TouchEventEmitter::onPointerOver(const PointerEvent& event) const {
  dispatchPointerEvent(
      "pointerOver", event, RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onPointerOut(const PointerEvent& event) const {
  dispatchPointerEvent(
      "pointerOut", event, RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onGotPointerCapture(const PointerEvent& event) const {
  dispatchPointerEvent(
      "gotPointerCapture", event, RawEvent::Category::ContinuousStart);
}

void TouchEventEmitter::onLostPointerCapture(const PointerEvent& event) const {
  dispatchPointerEvent(
      "lostPointerCapture", event, RawEvent::Category::ContinuousEnd);
}

} // namespace facebook::react
