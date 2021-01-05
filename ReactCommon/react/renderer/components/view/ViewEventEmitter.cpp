/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewEventEmitter.h"

namespace facebook {
namespace react {

#pragma mark - Accessibility

void ViewEventEmitter::onAccessibilityAction(const std::string &name) const {
  dispatchEvent("accessibilityAction", [name](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "action", name);
    return payload;
  });
}

void ViewEventEmitter::onAccessibilityTap() const {
  dispatchEvent("accessibilityTap");
}

void ViewEventEmitter::onAccessibilityMagicTap() const {
  dispatchEvent("magicTap");
}

void ViewEventEmitter::onAccessibilityEscape() const {
  dispatchEvent("accessibilityEscape");
}

#pragma mark - Layout

void ViewEventEmitter::onLayout(const LayoutMetrics &layoutMetrics) const {
  // Due to State Reconciliation, `onLayout` can be called potentially many
  // times with identical layoutMetrics. Ensure that the JS event is only
  // dispatched when the value changes.
  {
    std::lock_guard<std::mutex> guard(layoutMetricsMutex_);
    if (lastLayoutMetrics_ == layoutMetrics) {
      return;
    }
    lastLayoutMetrics_ = layoutMetrics;
  }

  auto expectedEventCount = ++*eventCounter_;

  // dispatchUniqueEvent only drops consecutive onLayout events to the same
  // node. We want to drop *any* unprocessed onLayout events when there's a
  // newer one.
  dispatchEvent(
      "layout",
      [frame = layoutMetrics.frame,
       expectedEventCount,
       eventCounter = eventCounter_](jsi::Runtime &runtime) {
        auto actualEventCount = eventCounter->load();
        if (expectedEventCount != actualEventCount) {
          // Drop stale events
          return jsi::Value::null();
        }

        auto layout = jsi::Object(runtime);
        layout.setProperty(runtime, "x", frame.origin.x);
        layout.setProperty(runtime, "y", frame.origin.y);
        layout.setProperty(runtime, "width", frame.size.width);
        layout.setProperty(runtime, "height", frame.size.height);
        auto payload = jsi::Object(runtime);
        payload.setProperty(runtime, "layout", std::move(layout));
        return jsi::Value(std::move(payload));
      });
}

} // namespace react
} // namespace facebook
