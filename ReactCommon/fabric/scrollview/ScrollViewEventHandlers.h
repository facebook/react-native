/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <memory>

#include <fabric/graphics/Geometry.h>
#include <fabric/core/EventHandlers.h>
#include <fabric/view/ViewEventHandlers.h>

#include <folly/dynamic.h>

namespace facebook {
namespace react {

class ScrollViewMetrics {
public:
  Size contentSize;
  Point contentOffset;
  EdgeInsets contentInset;
  Size containerSize;
  Float zoomScale;
};

class ScrollViewEventHandlers;

using SharedScrollViewEventHandlers = std::shared_ptr<const ScrollViewEventHandlers>;

class ScrollViewEventHandlers:
  public ViewEventHandlers {

public:

  using ViewEventHandlers::ViewEventHandlers;

  void onScroll(const ScrollViewMetrics &scrollViewMetrics) const;
  void onScrollBeginDrag(const ScrollViewMetrics &scrollViewMetrics) const;
  void onScrollEndDrag(const ScrollViewMetrics &scrollViewMetrics) const;
  void onMomentumScrollBegin(const ScrollViewMetrics &scrollViewMetrics) const;
  void onMomentumScrollEnd(const ScrollViewMetrics &scrollViewMetrics) const;

private:

  void dispatchScrollViewEvent(const std::string &name, const ScrollViewMetrics &scrollViewMetrics, const folly::dynamic &payload = {}) const;
};

} // namespace react
} // namespace facebook
