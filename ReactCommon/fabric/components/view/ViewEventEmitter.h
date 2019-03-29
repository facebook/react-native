/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <memory>

#include <react/core/LayoutMetrics.h>
#include <react/core/ReactPrimitives.h>
#include "TouchEventEmitter.h"

namespace facebook {
namespace react {

class ViewEventEmitter;

using SharedViewEventEmitter = std::shared_ptr<const ViewEventEmitter>;

class ViewEventEmitter : public TouchEventEmitter {
 public:
  using TouchEventEmitter::TouchEventEmitter;

#pragma mark - Accessibility

  void onAccessibilityAction(const std::string &name) const;
  void onAccessibilityTap() const;
  void onAccessibilityMagicTap() const;

#pragma mark - Layout

  void onLayout(const LayoutMetrics &layoutMetrics) const;
};

} // namespace react
} // namespace facebook
