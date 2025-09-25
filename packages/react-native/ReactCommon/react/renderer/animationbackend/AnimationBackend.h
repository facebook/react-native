/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <functional>
#include <vector>

namespace facebook::react {

struct AnimationMutation {
  Tag tag;
  double opacity;
};

using AnimationMutations = std::vector<AnimationMutation>;
using Callback = std::function<AnimationMutations(float)>;
using StartOnRenderCallback = std::function<void(std::function<void()>&&)>;
using StopOnRenderCallback = std::function<void()>;
using DirectManipulationCallback =
    std::function<void(Tag, const folly::dynamic&)>;

class AnimationBackend {
 public:
  std::vector<Callback> callbacks;
  const StartOnRenderCallback& startOnRenderCallback_;
  const StopOnRenderCallback& stopOnRenderCallback_;
  const DirectManipulationCallback& directManipulationCallback_;

  AnimationBackend(
      const StartOnRenderCallback& startOnRenderCallback,
      const StopOnRenderCallback& stopOnRenderCallback,
      const DirectManipulationCallback& directManipulationCallback);
  void onAnimationFrame(double timestamp);
  void start(const Callback& callback);
  void stop();
};
} // namespace facebook::react
