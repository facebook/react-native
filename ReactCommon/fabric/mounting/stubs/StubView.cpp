// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "StubView.h"

namespace facebook {
namespace react {

void StubView::update(ShadowView const &shadowView) {
  componentName = shadowView.componentName;
  componentHandle = shadowView.componentHandle;
  tag = shadowView.tag;
  props = shadowView.props;
  eventEmitter = shadowView.eventEmitter;
  layoutMetrics = shadowView.layoutMetrics;
  state = shadowView.state;
}

bool operator==(StubView const &lhs, StubView const &rhs) {
  return std::tie(lhs.props, lhs.layoutMetrics) ==
      std::tie(rhs.props, rhs.layoutMetrics);
}

bool operator!=(StubView const &lhs, StubView const &rhs) {
  return !(lhs == rhs);
}

} // namespace react
} // namespace facebook
