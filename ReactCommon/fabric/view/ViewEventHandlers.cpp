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

} // namespace react
} // namespace facebook
