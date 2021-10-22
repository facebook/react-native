/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/animations/LayoutAnimationKeyFrameManager.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/mounting/ShadowViewMutation.h>

namespace facebook {
namespace react {

class LayoutAnimationDriver : public LayoutAnimationKeyFrameManager {
 public:
  LayoutAnimationDriver(
      RuntimeExecutor runtimeExecutor,
      ContextContainer::Shared &contextContainer,
      LayoutAnimationStatusDelegate *delegate)
      : LayoutAnimationKeyFrameManager(
            runtimeExecutor,
            contextContainer,
            delegate) {}

 protected:
  virtual void animationMutationsForFrame(
      SurfaceId surfaceId,
      ShadowViewMutation::List &mutationsList,
      uint64_t now) const override;
};

} // namespace react
} // namespace facebook
