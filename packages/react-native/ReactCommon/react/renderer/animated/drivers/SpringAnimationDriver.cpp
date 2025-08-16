/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "SpringAnimationDriver.h"
#include <react/renderer/animated/drivers/AnimationDriverUtils.h>
#include <react/renderer/animated/nodes/ValueAnimatedNode.h>

namespace facebook::react {

static constexpr auto MaxDeltaTimeMs = 4.0 * 1000.0 / 60.0;

SpringAnimationDriver::SpringAnimationDriver(
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
      springStiffness_(config_["stiffness"].asDouble()),
      springDamping_(config_["damping"].asDouble()),
      springMass_(config_["mass"].asDouble()),
      initialVelocity_(config_["initialVelocity"].asDouble()),
      endValue_(config_["toValue"].asDouble()),
      restSpeedThreshold_(config_["restSpeedThreshold"].asDouble()),
      displacementFromRestThreshold_(
          config_["restDisplacementThreshold"].asDouble()),
      overshootClampingEnabled_(config_["overshootClamping"].asBool()) {}

std::tuple<float, double> SpringAnimationDriver::getValueAndVelocityForTime(
    double time) const {
  const auto startValue = fromValue_.value();
  const auto toValue = endValue_;
  const auto c = springDamping_;
  const auto m = springMass_;
  const auto k = springStiffness_;
  const auto v0 = -initialVelocity_;

  const auto zeta = c / (2 * std::sqrt(k * m));
  const auto omega0 = std::sqrt(k / m);
  const auto omega1 = omega0 * std::sqrt(1.0 - (zeta * zeta));
  const auto x0 = toValue - startValue;

  if (zeta < 1) {
    const auto envelope = std::exp(-zeta * omega0 * time);
    const auto value = static_cast<float>(
        toValue -
        envelope *
            ((v0 + zeta * omega0 * x0) / omega1 * std::sin(omega1 * time) +
             x0 * std::cos(omega1 * time)));
    const auto velocity = zeta * omega0 * envelope *
            (std::sin(omega1 * time) * (v0 + zeta * omega0 * x0) / omega1 +
             x0 * std::cos(omega1 * time)) -
        envelope *
            (std::cos(omega1 * time) * (v0 + zeta * omega0 * x0) -
             omega1 * x0 * std::sin(omega1 * time));
    return std::make_tuple(value, velocity);
  } else {
    const auto envelope = std::exp(-omega0 * time);
    const auto value = static_cast<float>(
        endValue_ - envelope * (x0 + (v0 + omega0 * x0) * time));
    const auto velocity =
        envelope * (v0 * (time * omega0 - 1) + time * x0 * (omega0 * omega0));
    return std::make_tuple(value, velocity);
  }
}

bool SpringAnimationDriver::update(double timeDeltaMs, bool restarting) {
  if (const auto node =
          manager_->getAnimatedNode<ValueAnimatedNode>(animatedValueTag_)) {
    if (restarting) {
      if (!fromValue_.has_value()) {
        fromValue_ = node->getRawValue();
      } else {
        if (node->setRawValue(fromValue_.value())) {
          markNodeUpdated(node->tag());
        }
      }

      // Spring animations run a frame behind JS driven animations if we do
      // not start the first frame at 16ms.
      lastTime_ = timeDeltaMs - SingleFrameIntervalMs;
      timeAccumulator_ = 0.0;
    }

    // clamp the amount of timeDeltaMs to avoid stuttering in the UI.
    // We should be able to catch up in a subsequent advance if necessary.
    auto adjustedDeltaTime = timeDeltaMs - lastTime_;
    if (adjustedDeltaTime > MaxDeltaTimeMs) {
      adjustedDeltaTime = MaxDeltaTimeMs;
    }
    timeAccumulator_ += adjustedDeltaTime;
    lastTime_ = timeDeltaMs;

    auto [value, velocity] =
        getValueAndVelocityForTime(timeAccumulator_ / 1000.0);

    auto isComplete = false;
    if (isAtRest(velocity, value, endValue_) ||
        (overshootClampingEnabled_ && isOvershooting(value))) {
      if (springStiffness_ > 0) {
        value = static_cast<float>(endValue_);
      } else {
        endValue_ = value;
      }

      isComplete = true;
    }

    if (node->setRawValue(value)) {
      markNodeUpdated(node->tag());
    }

    return isComplete;
  }

  return true;
}

bool SpringAnimationDriver::isAtRest(
    double currentVelocity,
    double currentValue,
    double endValue) const {
  return std::abs(currentVelocity) <= restSpeedThreshold_ &&
      (std::abs(currentValue - endValue) <= displacementFromRestThreshold_ ||
       springStiffness_ == 0);
}

bool SpringAnimationDriver::isOvershooting(double currentValue) const {
  const auto startValue = fromValue_.value();
  return springStiffness_ > 0 &&
      ((startValue < endValue_ && currentValue > endValue_) ||
       (startValue > endValue_ && currentValue < endValue_));
}

} // namespace facebook::react
