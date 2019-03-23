/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <memory>

#include <folly/dynamic.h>
#include <react/components/view/ViewEventEmitter.h>
#include <react/events/EventEmitter.h>
#include <react/graphics/Geometry.h>

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

using SharedScrollViewEventEmitter =
    std::shared_ptr<const ScrollViewEventEmitter>;

class ScrollViewEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onScroll(const ScrollViewMetrics &scrollViewMetrics) const;
  void onScrollBeginDrag(const ScrollViewMetrics &scrollViewMetrics) const;
  void onScrollEndDrag(const ScrollViewMetrics &scrollViewMetrics) const;
  void onMomentumScrollBegin(const ScrollViewMetrics &scrollViewMetrics) const;
  void onMomentumScrollEnd(const ScrollViewMetrics &scrollViewMetrics) const;

 private:
  void dispatchScrollViewEvent(
      const std::string &name,
      const ScrollViewMetrics &scrollViewMetrics,
      const folly::dynamic &payload = {}) const;
};

} // namespace react
} // namespace facebook
