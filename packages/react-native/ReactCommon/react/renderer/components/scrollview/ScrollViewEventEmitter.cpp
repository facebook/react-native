/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollViewEventEmitter.h"

namespace facebook::react {

void ScrollViewEventEmitter::onScroll(const ScrollEvent& scrollEvent) const {
  dispatchUniqueEvent("scroll", [scrollEvent](jsi::Runtime& runtime) {
    return scrollEvent.asJSIValue(runtime);
  });
}

void ScrollViewEventEmitter::experimental_onDiscreteScroll(
    const ScrollEvent& scrollEvent) const {
  dispatchEvent(
      "scroll",
      [scrollEvent](jsi::Runtime& runtime) {
        return scrollEvent.asJSIValue(runtime);
      },
      RawEvent::Category::Discrete);
}

void ScrollViewEventEmitter::onScrollToTop(
    const ScrollEvent& scrollEvent) const {
  dispatchUniqueEvent("scrollToTop", [scrollEvent](jsi::Runtime& runtime) {
    return scrollEvent.asJSIValue(runtime);
  });
}

void ScrollViewEventEmitter::onScrollBeginDrag(
    const ScrollEvent& scrollEvent) const {
  dispatchScrollViewEvent("scrollBeginDrag", scrollEvent);
}

void ScrollViewEventEmitter::onScrollEndDrag(
    const ScrollEvent& scrollEvent) const {
  dispatchScrollViewEvent("scrollEndDrag", scrollEvent);
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
  dispatchEvent(std::move(name), [scrollEvent](jsi::Runtime& runtime) {
    return scrollEvent.asJSIValue(runtime);
  });
}

} // namespace facebook::react
