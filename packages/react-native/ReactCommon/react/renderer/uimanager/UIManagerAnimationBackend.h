/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvoker.h>
#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/core/ShadowNodeFamily.h>

namespace facebook::react {

struct AnimationMutations;
using CallbackId = uint64_t;

class UIManagerAnimationBackend {
 public:
  using Callback = std::function<AnimationMutations(float)>;

  virtual ~UIManagerAnimationBackend() = default;

  virtual void onAnimationFrame(double timestamp) = 0;
  virtual CallbackId start(const Callback &callback) = 0;
  virtual void stop(CallbackId callbackId) = 0;
  virtual void clearRegistry(SurfaceId surfaceId) = 0;
  virtual void trigger() = 0;
  virtual void registerJSInvoker(std::shared_ptr<CallInvoker> jsInvoker) = 0;
};

} // namespace facebook::react
