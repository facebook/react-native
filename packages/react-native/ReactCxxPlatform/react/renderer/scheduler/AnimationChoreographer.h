/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
namespace facebook::react {

/*
 * This class serves as an interface for native animation frame scheduling that can be used as abstraction in
 * ReactCxxPlatform.
 */
class AnimationChoreographer {
 public:
  virtual ~AnimationChoreographer() = default;

  virtual void resume() = 0;
  virtual void pause() = 0;
  void setOnAnimationTick(std::function<void(float)> onAnimationTick)
  {
    onAnimationTick_ = std::move(onAnimationTick);
  }

 protected:
  std::function<void(float)> onAnimationTick_;
};

} // namespace facebook::react
