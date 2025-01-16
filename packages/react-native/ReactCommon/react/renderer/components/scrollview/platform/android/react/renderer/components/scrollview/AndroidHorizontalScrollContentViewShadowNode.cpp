/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/components/scrollview/AndroidHorizontalScrollContentViewShadowNode.h>

namespace facebook::react {

const char AndroidHorizontalScrollContentViewShadowNodeComponentName[] =
    "AndroidHorizontalScrollContentView";

void AndroidHorizontalScrollContentViewShadowNode::layout(
    LayoutContext layoutContext) {
  ConcreteViewShadowNode::layout(layoutContext);

  // When the layout direction is RTL, we expect Yoga to give us a layout
  // that extends off the screen to the left so we re-center it to be at most
  // zero (where the scrolling offset will be adjusted to match if larger than
  // parent width on the Android component side).
  if (layoutMetrics_.layoutDirection == LayoutDirection::RightToLeft &&
      layoutMetrics_.frame.origin.x < 0) {
    layoutMetrics_.frame.origin.x = 0;
  }
}

} // namespace facebook::react
