/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/animated/MergedValueDispatcher.h>
#include <react/renderer/uimanager/UIManagerNativeAnimatedDelegate.h>
#include "NativeAnimatedNodesManager.h"

namespace facebook::react {

class AnimatedMountingOverrideDelegate;

class NativeAnimatedNodesManagerProvider {
 public:
  using FrameRateListenerCallback =
      std::function<void(bool /* shouldEnableListener */)>;
  using StartOnRenderCallback = std::function<void(std::function<void()>&&)>;
  using StopOnRenderCallback = NativeAnimatedNodesManager::StopOnRenderCallback;

  NativeAnimatedNodesManagerProvider(
      StartOnRenderCallback startOnRenderCallback = nullptr,
      StopOnRenderCallback stopOnRenderCallback = nullptr,
      FrameRateListenerCallback frameRateListenerCallback = nullptr);

  std::shared_ptr<NativeAnimatedNodesManager> getOrCreate(
      jsi::Runtime& runtime,
      std::shared_ptr<CallInvoker> jsInvoker);

  // Native Event Listeners
  void addEventEmitterListener(
      const std::shared_ptr<EventEmitterListener>& listener);

  std::shared_ptr<EventEmitterListener> getEventEmitterListener();

 private:
  std::shared_ptr<UIManagerAnimationBackend> animationBackend_;
  std::shared_ptr<NativeAnimatedNodesManager> nativeAnimatedNodesManager_;

  std::shared_ptr<EventEmitterListenerContainer> eventEmitterListenerContainer_;
  std::shared_ptr<EventEmitterListener> eventEmitterListener_;

  std::shared_ptr<UIManagerNativeAnimatedDelegate> nativeAnimatedDelegate_;
  std::shared_ptr<AnimatedMountingOverrideDelegate>
      animatedMountingOverrideDelegate_;

  FrameRateListenerCallback frameRateListenerCallback_;
  StartOnRenderCallback startOnRenderCallback_;
  StopOnRenderCallback stopOnRenderCallback_;

  std::unique_ptr<MergedValueDispatcher> mergedValueDispatcher_;
};

class UIManagerNativeAnimatedDelegateImpl
    : public UIManagerNativeAnimatedDelegate {
 public:
  explicit UIManagerNativeAnimatedDelegateImpl(
      NativeAnimatedNodesManagerProvider::FrameRateListenerCallback
          frameRateListenerCallback);

  void runAnimationFrame() override;

  void setNativeAnimatedNodesManager(
      std::weak_ptr<NativeAnimatedNodesManager> manager) {
    nativeAnimatedNodesManager_ = manager;
  }

 private:
  std::weak_ptr<NativeAnimatedNodesManager> nativeAnimatedNodesManager_;
  NativeAnimatedNodesManagerProvider::FrameRateListenerCallback
      frameRateListenerCallback_;
};

} // namespace facebook::react
