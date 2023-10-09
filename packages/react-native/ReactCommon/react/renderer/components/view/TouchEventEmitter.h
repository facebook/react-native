/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/PointerEvent.h>
#include <react/renderer/components/view/TouchEvent.h>
#include <react/renderer/core/EventEmitter.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/debug/DebugStringConvertible.h>

namespace facebook::react {

class TouchEventEmitter;

using SharedTouchEventEmitter = std::shared_ptr<const TouchEventEmitter>;

class TouchEventEmitter : public EventEmitter {
 public:
  using EventEmitter::EventEmitter;

  void onTouchStart(const TouchEvent& event) const;
  void onTouchMove(const TouchEvent& event) const;
  void onTouchEnd(const TouchEvent& event) const;
  void onTouchCancel(const TouchEvent& event) const;

  void onClick(const PointerEvent& event) const;
  void onPointerCancel(const PointerEvent& event) const;
  void onPointerDown(const PointerEvent& event) const;
  void onPointerMove(const PointerEvent& event) const;
  void onPointerUp(const PointerEvent& event) const;
  void onPointerEnter(const PointerEvent& event) const;
  void onPointerLeave(const PointerEvent& event) const;
  void onPointerOver(const PointerEvent& event) const;
  void onPointerOut(const PointerEvent& event) const;
  void onGotPointerCapture(const PointerEvent& event) const;
  void onLostPointerCapture(const PointerEvent& event) const;

 private:
  void dispatchTouchEvent(
      std::string type,
      const TouchEvent& event,
      EventPriority priority,
      RawEvent::Category category) const;
  void dispatchPointerEvent(
      std::string type,
      const PointerEvent& event,
      EventPriority priority,
      RawEvent::Category category) const;
};

} // namespace facebook::react
