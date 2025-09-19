/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AnimationBackend.h"

namespace facebook::react {

AnimationBackend::AnimationBackend(
    const StartOnRenderCallback& startOnRenderCallback,
    const StopOnRenderCallback& stopOnRenderCallback,
    const DirectManipulationCallback& directManipulationCallback)
    : startOnRenderCallback_(startOnRenderCallback),
      stopOnRenderCallback_(stopOnRenderCallback),
      directManipulationCallback_(directManipulationCallback) {}

void AnimationBackend::onAnimationFrame(double timestamp) {
  for (auto& callback : callbacks) {
    auto muatations = callback(timestamp);
    for (auto& mutation : muatations) {
      directManipulationCallback_(
          mutation.tag, folly::dynamic::object("opacity", mutation.opacity));
    }
  }
}

void AnimationBackend::start(const Callback& callback) {
  callbacks.push_back(callback);
  // startOnRenderCallback_ should provide the timestamp from the platform
  startOnRenderCallback_([this]() { onAnimationFrame(0); });
}
void AnimationBackend::stop() {
  stopOnRenderCallback_();
  callbacks.clear();
}
} // namespace facebook::react
