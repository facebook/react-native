/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "DecayAnimationDriver.h"
#include <react/debug/react_native_assert.h>
#include <react/renderer/animated/nodes/ValueAnimatedNode.h>

namespace facebook::react {
DecayAnimationDriver::DecayAnimationDriver(
    int id,
    Tag animatedValueTag,
    std::optional<AnimationEndCallback> endCallback,
    folly::dynamic config,
    NativeAnimatedNodesManager* manager)
    : AnimationDriver(
          id,
          animatedValueTag,
          std::move(endCallback),
          std::move(config),
          manager),
      velocity_(config_["velocity"].asDouble()),
      deceleration_(config_["deceleration"].asDouble()) {
  react_native_assert(deceleration_ > 0);
}

std::tuple<float, double> DecayAnimationDriver::getValueAndVelocityForTime(
    double time) const {
  const auto value = fromValue_.value() +
      velocity_ / (1 - deceleration_) *
          (1 - std::exp(-(1 - deceleration_) * (1000 * time)));
  return std::make_tuple(
      static_cast<float>(value),
      42.0f); // we don't need the velocity, so set it to a dummy value
}

bool DecayAnimationDriver::update(double timeDeltaMs, bool restarting) {
  if (const auto node =
          manager_->getAnimatedNode<ValueAnimatedNode>(animatedValueTag_)) {
    if (restarting) {
      const auto value = node->getRawValue();
      if (!fromValue_.has_value()) {
        // First iteration, assign fromValue based on AnimatedValue
        fromValue_ = value;
      } else {
        // Not the first iteration, reset AnimatedValue based on
        // originalValue
        if (node->setRawValue(fromValue_.value())) {
          markNodeUpdated(node->tag());
        }
      }

      lastValue_ = value;
    }

    const auto [value, velocity] =
        getValueAndVelocityForTime(timeDeltaMs / 1000.0);
    auto isComplete =
        lastValue_.has_value() && std::abs(value - lastValue_.value()) < 0.1;
    if (!restarting && isComplete) {
      return true;
    } else {
      lastValue_ = value;
      if (node->setRawValue(value)) {
        markNodeUpdated(node->tag());
      }
      return false;
    }
  }

  return true;
}

} // namespace facebook::react
