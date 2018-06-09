/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewEventHandlers.h"

namespace facebook {
namespace react {

#pragma mark - Accessibility

void ViewEventHandlers::onAccessibilityAction(const std::string &name) const {
  dispatchEvent("accessibilityAction", folly::dynamic::object("action", name));
}

void ViewEventHandlers::onAccessibilityTap() const {
  dispatchEvent("accessibilityTap");
}

void ViewEventHandlers::onAccessibilityMagicTap() const {
  dispatchEvent("magicTap");
}

#pragma mark - Layout

void ViewEventHandlers::onLayout(const LayoutMetrics &layoutMetrics) const {
  folly::dynamic payload = folly::dynamic::object();
  auto &&frame = layoutMetrics.frame;
  payload["layout"] = folly::dynamic::object
    ("x", frame.origin.x)
    ("y", frame.origin.y)
    ("width", frame.size.width)
    ("height", frame.size.height);

  dispatchEvent("layout", payload);
}

#pragma mark - Touches

static folly::dynamic touchPayload(const Touch &touch) {
  folly::dynamic object = folly::dynamic::object();
  object["locationX"] = touch.offsetPoint.x;
  object["locationY"] = touch.offsetPoint.x;
  object["pageX"] = touch.pagePoint.x;
  object["pageY"] = touch.pagePoint.x;
  object["screenX"] = touch.screenPoint.x;
  object["screenY"] = touch.screenPoint.x;
  object["identifier"] = touch.identifier;
  object["target"] = touch.target;
  object["timestamp"] = touch.timestamp * 1000;
  object["force"] = touch.force;
  return object;
}

static folly::dynamic touchesPayload(const Touches &touches) {
  folly::dynamic array = folly::dynamic::array();
  for (auto &&touch : touches) {
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

void ViewEventHandlers::onTouchStart(const TouchEvent &event) const {
  dispatchEvent("touchStart", touchEventPayload(event));
}

void ViewEventHandlers::onTouchMove(const TouchEvent &event) const {
  dispatchEvent("touchMove", touchEventPayload(event));
}

void ViewEventHandlers::onTouchEnd(const TouchEvent &event) const {
  dispatchEvent("touchEnd", touchEventPayload(event));
}

void ViewEventHandlers::onTouchCancel(const TouchEvent &event) const {
  dispatchEvent("touchCancel", touchEventPayload(event));
}

} // namespace react
} // namespace facebook
