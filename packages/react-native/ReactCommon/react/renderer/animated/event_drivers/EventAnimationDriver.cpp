/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "EventAnimationDriver.h"

#include <react/renderer/animated/nodes/ValueAnimatedNode.h>

namespace facebook::react {

EventAnimationDriver::EventAnimationDriver(
    const std::vector<std::string>& eventPath,
    Tag animatedValueTag)
    : eventPath_(eventPath), animatedValueTag_(animatedValueTag) {}

std::optional<double> EventAnimationDriver::getValueFromPayload(
    const EventPayload& eventPayload) {
  return eventPayload.extractValue(eventPath_);
}

} // namespace facebook::react
