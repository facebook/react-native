/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <jsi/jsi.h>
#include <react/renderer/core/EventTargetWrapper.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/primitives.h>

namespace facebook::react {

using DispatchEvent = std::function<void(
    jsi::Runtime &runtime,
    EventTarget const *eventTarget,
    std::string const &type,
    ReactEventPriority priority,
    jsi::Value &event)>;

using PointerIdentifier = int;

class PointerEventsProcessor final {
 public:
  explicit PointerEventsProcessor(std::shared_ptr<UIManager> uiManager);

  static bool isPointerEvent(std::string const &type);

  void interceptPointerEvent(
      jsi::Runtime &runtime,
      EventTarget const *eventTarget,
      std::string const &type,
      ReactEventPriority priority,
      jsi::Value &payload,
      DispatchEvent const &eventDispatcher);

  void setPointerCapture(
      PointerIdentifier pointerId,
      ShadowNode::Shared const &shadowNode);
  void releasePointerCapture(
      PointerIdentifier pointerId,
      ShadowNode const *shadowNode);
  bool hasPointerCapture(
      PointerIdentifier pointerId,
      ShadowNode const *shadowNode);

 private:
  void processPendingPointerCapture(
      PointerEvent const &event,
      jsi::Runtime &runtime,
      DispatchEvent const &eventDispatcher);

  static std::unordered_set<std::string> pointerEventNames() {
    static const std::unordered_set<std::string> n = {
        "topPointerDown",
        "topPointerMove",
        "topPointerUp",
        "topPointerCancel",
        "topPointerEnter",
        "topPointerLeave",
        "topPointerOver",
        "topPointerOut"};
    return n;
  }
  static PointerEvent pointerEventFromValue(
      jsi::Runtime &runtime,
      jsi::Value const &value);
  static jsi::Value valueFromPointerEvent(
      jsi::Runtime &runtime,
      PointerEvent const &event);

  std::shared_ptr<UIManager> uiManager_;
  std::unordered_map<int, ShadowNode::Shared>
      pendingPointerCaptureTargetOverrides_;
  std::unordered_map<int, ShadowNode::Shared>
      activePointerCaptureTargetOverrides_;
};

} // namespace facebook::react
