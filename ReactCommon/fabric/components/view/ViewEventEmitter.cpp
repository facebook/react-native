/**
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
  dispatchEvent("accessibilityAction", folly::dynamic::object("action", name));
}

void ViewEventEmitter::onAccessibilityTap() const {
  dispatchEvent("accessibilityTap");
}

void ViewEventEmitter::onAccessibilityMagicTap() const {
  dispatchEvent("magicTap");
}

#pragma mark - Layout

void ViewEventEmitter::onLayout(const LayoutMetrics &layoutMetrics) const {
  folly::dynamic payload = folly::dynamic::object();
  const auto &frame = layoutMetrics.frame;
  payload["layout"] =
      folly::dynamic::object("x", frame.origin.x)("y", frame.origin.y)(
          "width", frame.size.width)("height", frame.size.height);

  dispatchEvent("layout", payload);
}

} // namespace react
} // namespace facebook
