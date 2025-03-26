/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/core/RawValue.h>

namespace facebook::react {

class UIManagerNativeAnimatedDelegate {
 public:
  ~UIManagerNativeAnimatedDelegate() = default;

  void runAnimationFrame() {
    std::unique_lock lock(animationFrameCallbackMutex_);
    if (animationFrameCallback_) {
      animationFrameCallback_();
    }
  }

  void setAnimationFrameCallback(std::function<void()> callback) {
    std::unique_lock lock(animationFrameCallbackMutex_);
    animationFrameCallback_ = std::move(callback);
  }

 private:
  std::function<void()> animationFrameCallback_;
  mutable std::shared_mutex animationFrameCallbackMutex_;
};

} // namespace facebook::react
