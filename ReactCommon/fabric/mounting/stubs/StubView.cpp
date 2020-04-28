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

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(StubView const &stubView) {
  return stubView.componentHandle == 0 ? "Invalid" : stubView.componentName;
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    StubView const &stabView,
    DebugStringConvertibleOptions options) {
  return {
      {"tag", getDebugDescription(stabView.tag, options)},
      {"props", getDebugDescription(stabView.props, options)},
      {"eventEmitter", getDebugDescription(stabView.eventEmitter, options)},
      {"layoutMetrics", getDebugDescription(stabView.layoutMetrics, options)},
      {"state", getDebugDescription(stabView.state, options)},
  };
}

std::vector<StubView> getDebugChildren(
    StubView const &stubView,
    DebugStringConvertibleOptions options) {
  auto children = std::vector<StubView>{};
  for (auto const &childStabView : stubView.children) {
    children.push_back(*childStabView);
  }
  return children;
}

#endif

} // namespace react
} // namespace facebook
