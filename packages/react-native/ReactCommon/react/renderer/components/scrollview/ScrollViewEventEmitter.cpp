/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollViewEventEmitter.h"

namespace facebook::react {

void ScrollViewEventEmitter::onScroll(const ScrollEvent& scrollEvent) const {
  dispatchUniqueEvent("scroll", std::make_shared<ScrollEvent>(scrollEvent));
}

void ScrollViewEventEmitter::onScrollToTop(
    const ScrollEvent& scrollEvent) const {
  dispatchUniqueEvent(
      "scrollToTop", std::make_shared<ScrollEvent>(scrollEvent));
}

void ScrollViewEventEmitter::onScrollBeginDrag(
    const ScrollEvent& scrollEvent) const {
  dispatchScrollViewEvent("scrollBeginDrag", scrollEvent);
}

void ScrollViewEventEmitter::onScrollEndDrag(
    const ScrollEndDragEvent& scrollEvent) const {
  dispatchEvent(
      "scrollEndDrag", std::make_shared<ScrollEndDragEvent>(scrollEvent));
}

void ScrollViewEventEmitter::onMomentumScrollBegin(
    const ScrollEvent& scrollEvent) const {
  dispatchScrollViewEvent("momentumScrollBegin", scrollEvent);
}

void ScrollViewEventEmitter::onMomentumScrollEnd(
    const ScrollEvent& scrollEvent) const {
  dispatchScrollViewEvent("momentumScrollEnd", scrollEvent);
}

void ScrollViewEventEmitter::dispatchScrollViewEvent(
    std::string name,
    const ScrollEvent& scrollEvent) const {
  dispatchEvent(std::move(name), std::make_shared<ScrollEvent>(scrollEvent));
}

} // namespace facebook::react
