/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollViewEventEmitter.h"

namespace facebook::react {

static jsi::Value scrollViewMetricsPayload(
    jsi::Runtime& runtime,
    const ScrollViewMetrics& scrollViewMetrics) {
  auto payload = jsi::Object(runtime);

  {
    auto contentOffset = jsi::Object(runtime);
    contentOffset.setProperty(runtime, "x", scrollViewMetrics.contentOffset.x);
    contentOffset.setProperty(runtime, "y", scrollViewMetrics.contentOffset.y);
    payload.setProperty(runtime, "contentOffset", contentOffset);
  }

  {
    auto contentInset = jsi::Object(runtime);
    contentInset.setProperty(
        runtime, "top", scrollViewMetrics.contentInset.top);
    contentInset.setProperty(
        runtime, "left", scrollViewMetrics.contentInset.left);
    contentInset.setProperty(
        runtime, "bottom", scrollViewMetrics.contentInset.bottom);
    contentInset.setProperty(
        runtime, "right", scrollViewMetrics.contentInset.right);
    payload.setProperty(runtime, "contentInset", contentInset);
  }

  {
    auto contentSize = jsi::Object(runtime);
    contentSize.setProperty(
        runtime, "width", scrollViewMetrics.contentSize.width);
    contentSize.setProperty(
        runtime, "height", scrollViewMetrics.contentSize.height);
    payload.setProperty(runtime, "contentSize", contentSize);
  }

  {
    auto containerSize = jsi::Object(runtime);
    containerSize.setProperty(
        runtime, "width", scrollViewMetrics.containerSize.width);
    containerSize.setProperty(
        runtime, "height", scrollViewMetrics.containerSize.height);
    payload.setProperty(runtime, "layoutMeasurement", containerSize);
  }

  payload.setProperty(runtime, "zoomScale", scrollViewMetrics.zoomScale);

  return payload;
}

void ScrollViewEventEmitter::onScroll(
    const ScrollViewMetrics& scrollViewMetrics) const {
  dispatchUniqueEvent("scroll", [scrollViewMetrics](jsi::Runtime& runtime) {
    return scrollViewMetricsPayload(runtime, scrollViewMetrics);
  });
}

void ScrollViewEventEmitter::onScrollToTop(
    const ScrollViewMetrics& scrollViewMetrics) const {
  dispatchUniqueEvent(
      "scrollToTop", [scrollViewMetrics](jsi::Runtime& runtime) {
        return scrollViewMetricsPayload(runtime, scrollViewMetrics);
      });
}

void ScrollViewEventEmitter::onScrollBeginDrag(
    const ScrollViewMetrics& scrollViewMetrics) const {
  dispatchScrollViewEvent("scrollBeginDrag", scrollViewMetrics);
}

void ScrollViewEventEmitter::onScrollEndDrag(
    const ScrollViewMetrics& scrollViewMetrics) const {
  dispatchScrollViewEvent("scrollEndDrag", scrollViewMetrics);
}

void ScrollViewEventEmitter::onMomentumScrollBegin(
    const ScrollViewMetrics& scrollViewMetrics) const {
  dispatchScrollViewEvent("momentumScrollBegin", scrollViewMetrics);
}

void ScrollViewEventEmitter::onMomentumScrollEnd(
    const ScrollViewMetrics& scrollViewMetrics) const {
  dispatchScrollViewEvent("momentumScrollEnd", scrollViewMetrics);
}

void ScrollViewEventEmitter::dispatchScrollViewEvent(
    std::string name,
    const ScrollViewMetrics& scrollViewMetrics,
    EventPriority priority) const {
  dispatchEvent(
      std::move(name),
      [scrollViewMetrics](jsi::Runtime& runtime) {
        return scrollViewMetricsPayload(runtime, scrollViewMetrics);
      },
      priority);
}

} // namespace facebook::react
