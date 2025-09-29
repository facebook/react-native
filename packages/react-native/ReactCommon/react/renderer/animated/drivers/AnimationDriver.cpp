/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "AnimationDriver.h"

#include <glog/logging.h>
#include <react/renderer/animated/drivers/AnimationDriverUtils.h>
#include <react/renderer/animated/nodes/ValueAnimatedNode.h>
#include <utility>

namespace facebook::react {

std::optional<AnimationDriverType> AnimationDriver::getDriverTypeByName(
    const std::string& driverTypeName) {
  if (driverTypeName == "frames") {
    return AnimationDriverType::Frames;
  } else if (driverTypeName == "spring") {
    return AnimationDriverType::Spring;
  } else if (driverTypeName == "decay") {
    return AnimationDriverType::Decay;
  } else {
    return std::nullopt;
  }
}

AnimationDriver::AnimationDriver(
    int id,
    Tag animatedValueTag,
    std::optional<AnimationEndCallback> endCallback,
    folly::dynamic config,
    NativeAnimatedNodesManager* manager)
    : endCallback_(std::move(endCallback)),
      id_(id),
      animatedValueTag_(animatedValueTag),
      manager_(manager),
      config_(std::move(config)) {
  onConfigChanged();
}

void AnimationDriver::startAnimation() {
  startFrameTimeMs_ = -1;
  isStarted_ = true;
}

void AnimationDriver::stopAnimation(bool /*ignoreCompletedHandlers*/) {
  if (auto node =
          manager_->getAnimatedNode<ValueAnimatedNode>(animatedValueTag_);
      node != nullptr && endCallback_) {
    endCallback_.value().call(
        {.finished = true,
         .value = node->getRawValue(),
         .offset = node->getOffset()});
  }
}

void AnimationDriver::runAnimationStep(double renderingTime) {
  if (!isStarted_ || isComplete_) {
    return;
  }

  const auto frameTimeMs = renderingTime;
  auto restarting = false;
  if (startFrameTimeMs_ < 0) {
    startFrameTimeMs_ = frameTimeMs;
    restarting = true;
  }

  const auto timeDeltaMs = frameTimeMs - startFrameTimeMs_;
  const auto isComplete = update(timeDeltaMs, restarting);

  if (isComplete) {
    if (iterations_ == -1 || ++currentIteration_ < iterations_) {
      startFrameTimeMs_ = -1;
    } else {
      isComplete_ = true;
    }
  }
}

void AnimationDriver::updateConfig(folly::dynamic config) {
  config_ = std::move(config);
  onConfigChanged();
}

void AnimationDriver::onConfigChanged() {
  iterations_ = (config_.count("iterations") != 0u)
      ? static_cast<int>(config_["iterations"].asDouble())
      : 1;
  isComplete_ = iterations_ == 0;
  currentIteration_ = 1;
  startFrameTimeMs_ = -1;
}

} // namespace facebook::react
