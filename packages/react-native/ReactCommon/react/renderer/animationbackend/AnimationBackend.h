/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerAnimationBackend.h>
#include <functional>
#include <vector>
#include "AnimatedProps.h"
#include "AnimatedPropsBuilder.h"
#include "AnimatedPropsRegistry.h"
#include "AnimationBackendCommitHook.h"

namespace facebook::react {

class AnimationBackend;

class UIManagerNativeAnimatedDelegateBackendImpl : public UIManagerNativeAnimatedDelegate {
 public:
  explicit UIManagerNativeAnimatedDelegateBackendImpl(std::weak_ptr<UIManagerAnimationBackend> animationBackend);

  void runAnimationFrame() override;

 private:
  std::weak_ptr<UIManagerAnimationBackend> animationBackend_;
};

struct AnimationMutation {
  Tag tag;
  std::shared_ptr<const ShadowNodeFamily> family;
  AnimatedProps props;
  bool hasLayoutUpdates{false};
};

struct AnimationMutations {
  std::vector<AnimationMutation> batch;
};

class AnimationBackend : public UIManagerAnimationBackend {
 public:
  using Callback = std::function<AnimationMutations(float)>;
  using StartOnRenderCallback = std::function<void(std::function<void()> &&, bool /* isAsync */)>;
  using StopOnRenderCallback = std::function<void(bool /* isAsync */)>;
  using DirectManipulationCallback = std::function<void(Tag, const folly::dynamic &)>;
  using FabricCommitCallback = std::function<void(std::unordered_map<Tag, folly::dynamic> &)>;

  std::vector<Callback> callbacks;
  const StartOnRenderCallback startOnRenderCallback_;
  const StopOnRenderCallback stopOnRenderCallback_;
  const DirectManipulationCallback directManipulationCallback_;
  const FabricCommitCallback fabricCommitCallback_;
  std::shared_ptr<AnimatedPropsRegistry> animatedPropsRegistry_;
  UIManager *uiManager_;
  AnimationBackendCommitHook commitHook_;

  AnimationBackend(
      StartOnRenderCallback &&startOnRenderCallback,
      StopOnRenderCallback &&stopOnRenderCallback,
      DirectManipulationCallback &&directManipulationCallback,
      FabricCommitCallback &&fabricCommitCallback,
      UIManager *uiManager);
  void commitUpdates(SurfaceId surfaceId, SurfaceUpdates &surfaceUpdates);
  void synchronouslyUpdateProps(const std::unordered_map<Tag, AnimatedProps> &updates);
  void clearRegistry(SurfaceId surfaceId) override;

  void onAnimationFrame(double timestamp) override;
  void start(const Callback &callback, bool isAsync);
  void stop(bool isAsync) override;
};
} // namespace facebook::react
