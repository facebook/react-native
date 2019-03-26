/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <memory>

#include <fabric/components/view/ViewEventEmitter.h>
#include <fabric/events/EventEmitter.h>
#include <fabric/graphics/Geometry.h>
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

class ScrollViewEventEmitter;

using SharedScrollViewEventEmitter = std::shared_ptr<const ScrollViewEventEmitter>;

class ScrollViewEventEmitter:
  public ViewEventEmitter {

public:

  using ViewEventEmitter::ViewEventEmitter;

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
