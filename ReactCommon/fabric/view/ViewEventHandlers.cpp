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

} // namespace react
} // namespace facebook
