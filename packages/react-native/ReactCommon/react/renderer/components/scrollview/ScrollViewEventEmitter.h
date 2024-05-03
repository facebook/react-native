/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <folly/dynamic.h>
#include <react/renderer/components/view/ViewEventEmitter.h>
#include <react/renderer/core/EventEmitter.h>

namespace facebook::react {

class ScrollViewEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  struct Metrics {
    Size contentSize;
    Point contentOffset;
    EdgeInsets contentInset;
    Size containerSize;
    Float zoomScale{};
  };

  void onScroll(const Metrics& scrollViewMetrics) const;
  void experimental_onDiscreteScroll(const Metrics& scrollViewMetrics) const;
  void onScrollBeginDrag(const Metrics& scrollViewMetrics) const;
  void onScrollEndDrag(const Metrics& scrollViewMetrics) const;
  void onMomentumScrollBegin(const Metrics& scrollViewMetrics) const;
  void onMomentumScrollEnd(const Metrics& scrollViewMetrics) const;
  void onScrollToTop(const Metrics& scrollViewMetrics) const;

 private:
  void dispatchScrollViewEvent(
      std::string name,
      const Metrics& scrollViewMetrics) const;
};

} // namespace facebook::react
