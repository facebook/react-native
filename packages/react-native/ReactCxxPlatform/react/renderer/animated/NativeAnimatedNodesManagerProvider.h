/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/uimanager/UIManagerNativeAnimatedDelegate.h>
#include "NativeAnimatedNodesManager.h"

namespace facebook::react {

class UIManagerBinding;

class UIManagerNativeAnimatedDelegateImpl
    : public UIManagerNativeAnimatedDelegate {
 public:
  explicit UIManagerNativeAnimatedDelegateImpl(
      std::weak_ptr<NativeAnimatedNodesManager> nativeAnimatedNodesManager);

  void runAnimationFrame() override;

 private:
  std::weak_ptr<NativeAnimatedNodesManager> nativeAnimatedNodesManager_;
};
class AnimatedMountingOverrideDelegate;

class NativeAnimatedNodesManagerProvider {
 public:
  NativeAnimatedNodesManagerProvider(
      NativeAnimatedNodesManager::StartOnRenderCallback startOnRenderCallback =
          nullptr,
      NativeAnimatedNodesManager::StopOnRenderCallback stopOnRenderCallback =
          nullptr);

  virtual ~NativeAnimatedNodesManagerProvider() = default;

  virtual std::shared_ptr<NativeAnimatedNodesManager> getOrCreate(
      jsi::Runtime& runtime);

  std::shared_ptr<NativeAnimatedNodesManager> get() {
    return nativeAnimatedNodesManager_;
  }

  // Native Event Listeners
  void addEventEmitterListener(
      const std::shared_ptr<EventEmitterListener>& listener);

  std::shared_ptr<EventEmitterListener> getEventEmitterListener();

 protected:
  std::shared_ptr<NativeAnimatedNodesManager> nativeAnimatedNodesManager_;
  std::weak_ptr<UIManagerBinding> uiManagerBinding_;

  std::shared_ptr<EventEmitterListenerContainer> eventEmitterListenerContainer_;
  std::shared_ptr<EventEmitterListener> eventEmitterListener_;

  std::shared_ptr<UIManagerNativeAnimatedDelegate> nativeAnimatedDelegate_;
  std::shared_ptr<AnimatedMountingOverrideDelegate>
      animatedMountingOverrideDelegate_;

  NativeAnimatedNodesManager::StartOnRenderCallback startOnRenderCallback_;
  NativeAnimatedNodesManager::StopOnRenderCallback stopOnRenderCallback_;
};

} // namespace facebook::react
