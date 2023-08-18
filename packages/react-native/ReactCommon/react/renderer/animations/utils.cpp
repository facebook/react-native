/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "utils.h"
#include <cmath>

namespace facebook::react {

std::pair<Float, Float> calculateAnimationProgress(
    uint64_t now,
    LayoutAnimation const &animation,
    AnimationConfig const &mutationConfig) {
  if (mutationConfig.animationType == AnimationType::None) {
    return {1, 1};
  }

  uint64_t startTime = animation.startTime;
  auto delay = (uint64_t)mutationConfig.delay;
  uint64_t endTime = startTime + delay + (uint64_t)mutationConfig.duration;

  if (now >= endTime) {
    return {1, 1};
  }
  if (now < startTime + delay) {
    return {0, 0};
  }

  double linearTimeProgression = 1 -
      (double)(endTime - delay - now) / (double)(endTime - animation.startTime);

  if (mutationConfig.animationType == AnimationType::Linear) {
    return {linearTimeProgression, linearTimeProgression};
  } else if (mutationConfig.animationType == AnimationType::EaseIn) {
    // This is an accelerator-style interpolator.
    // In the future, this parameter (2.0) could be adjusted. This has been the
    // default for Classic RN forever.
    return {linearTimeProgression, pow(linearTimeProgression, 2.0)};
  } else if (mutationConfig.animationType == AnimationType::EaseOut) {
    // This is an decelerator-style interpolator.
    // In the future, this parameter (2.0) could be adjusted. This has been the
    // default for Classic RN forever.
    return {linearTimeProgression, 1.0 - pow(1 - linearTimeProgression, 2.0)};
  } else if (mutationConfig.animationType == AnimationType::EaseInEaseOut) {
    // This is a combination of accelerate+decelerate.
    // The animation starts and ends slowly, and speeds up in the middle.
    return {
        linearTimeProgression,
        cos((linearTimeProgression + 1.0) * M_PI) / 2 + 0.5};
  } else if (mutationConfig.animationType == AnimationType::Spring) {
    // Using mSpringDamping in this equation is not really the exact
    // mathematical springDamping, but a good approximation We need to replace
    // this equation with the right Factor that accounts for damping and
    // friction
    double damping = mutationConfig.springDamping;
    return {
        linearTimeProgression,
        (1 +
         pow(2, -10 * linearTimeProgression) *
             sin((linearTimeProgression - damping / 4) * M_PI * 2 / damping))};
  } else {
    return {linearTimeProgression, linearTimeProgression};
  }
}

} // namespace facebook::react
