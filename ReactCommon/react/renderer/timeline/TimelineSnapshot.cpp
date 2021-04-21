/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TimelineSnapshot.h"

#include <react/utils/Telemetry.h>

namespace facebook {
namespace react {

TimelineSnapshot::TimelineSnapshot(
    RootShadowNode::Shared const &rootShadowNode,
    int index) noexcept
    : rootShadowNode_(rootShadowNode),
      frame_(TimelineFrame{index, telemetryTimePointNow()}) {}

RootShadowNode::Shared TimelineSnapshot::getRootShadowNode() const noexcept {
  return rootShadowNode_;
}

TimelineFrame TimelineSnapshot::getFrame() const noexcept {
  return frame_;
}

} // namespace react
} // namespace facebook
