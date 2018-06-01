/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollViewEventHandlers.h"

namespace facebook {
namespace react {

void ScrollViewEventHandlers::onScroll(const ScrollViewMetrics &scrollViewMetrics) const {
  dispatchScrollViewEvent("scroll", scrollViewMetrics);
}

void ScrollViewEventHandlers::onScrollBeginDrag(const ScrollViewMetrics &scrollViewMetrics) const {
  dispatchScrollViewEvent("scrollBeginDrag", scrollViewMetrics);
}

void ScrollViewEventHandlers::onScrollEndDrag(const ScrollViewMetrics &scrollViewMetrics) const {
  dispatchScrollViewEvent("scrollEndDrag", scrollViewMetrics);
}

void ScrollViewEventHandlers::onMomentumScrollBegin(const ScrollViewMetrics &scrollViewMetrics) const {
  dispatchScrollViewEvent("momentumScrollBegin", scrollViewMetrics);
}

void ScrollViewEventHandlers::onMomentumScrollEnd(const ScrollViewMetrics &scrollViewMetrics) const {
  dispatchScrollViewEvent("momentumScrollEnd", scrollViewMetrics);
}

void ScrollViewEventHandlers::dispatchScrollViewEvent(const std::string &name, const ScrollViewMetrics &scrollViewMetrics, const folly::dynamic &payload) const {
  folly::dynamic compoundPayload = folly::dynamic::object();

  compoundPayload["contentOffset"] = folly::dynamic::object
    ("x", scrollViewMetrics.contentOffset.x)
    ("y", scrollViewMetrics.contentOffset.y);

  compoundPayload["contentInset"] = folly::dynamic::object
    ("top", scrollViewMetrics.contentInset.top)
    ("left", scrollViewMetrics.contentInset.left)
    ("bottom", scrollViewMetrics.contentInset.bottom)
    ("right", scrollViewMetrics.contentInset.right);

  compoundPayload["contentSize"] = folly::dynamic::object
    ("width", scrollViewMetrics.contentSize.width)
    ("height", scrollViewMetrics.contentSize.height);

  compoundPayload["layoutMeasurement"] = folly::dynamic::object
    ("width", scrollViewMetrics.containerSize.width)
    ("height", scrollViewMetrics.containerSize.height);

  compoundPayload["zoomScale"] = scrollViewMetrics.zoomScale;

  if (!payload.isNull()) {
    compoundPayload.merge_patch(payload);
  }

  dispatchEvent(name, compoundPayload);
}

} // namespace react
} // namespace facebook
