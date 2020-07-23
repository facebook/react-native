/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/EventTarget.h>
#include <react/mounting/Differentiator.h>
#include <react/mounting/MountingCoordinator.h>
#include <react/mounting/MountingOverrideDelegate.h>
#include <react/mounting/MountingTransaction.h>
#include <react/uimanager/UIManagerAnimationDelegate.h>

#include <folly/dynamic.h>

#include "LayoutAnimationKeyFrameManager.h"

namespace facebook {
namespace react {

class LayoutAnimationDriver : public LayoutAnimationKeyFrameManager {
 public:
  LayoutAnimationDriver(LayoutAnimationStatusDelegate *delegate)
      : LayoutAnimationKeyFrameManager(delegate) {}

  virtual ~LayoutAnimationDriver() {}

 protected:
  virtual void animationMutationsForFrame(
      SurfaceId surfaceId,
      ShadowViewMutation::List &mutationsList,
      uint64_t now) const override;
  virtual double getProgressThroughAnimation(
      AnimationKeyFrame const &keyFrame,
      LayoutAnimation const *layoutAnimation,
      ShadowView const &animationStateView) const override;
};

} // namespace react
} // namespace facebook
