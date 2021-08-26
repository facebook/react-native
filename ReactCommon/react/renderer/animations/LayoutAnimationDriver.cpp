/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LayoutAnimationDriver.h"

#include <algorithm>
#include <chrono>

#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/mounting/MountingCoordinator.h>

#include <react/renderer/mounting/Differentiator.h>
#include <react/renderer/mounting/ShadowTreeRevision.h>
#include <react/renderer/mounting/ShadowView.h>
#include <react/renderer/mounting/ShadowViewMutation.h>

#include <glog/logging.h>
#include <react/debug/react_native_assert.h>

namespace facebook {
namespace react {

void LayoutAnimationDriver::animationMutationsForFrame(
    SurfaceId surfaceId,
    ShadowViewMutation::List &mutationsList,
    uint64_t now) const {
  for (auto &animation : inflightAnimations_) {
    if (animation.surfaceId != surfaceId) {
      continue;
    }
    if (animation.completed) {
      continue;
    }

    int incompleteAnimations = 0;
    for (auto &keyframe : animation.keyFrames) {
      if (keyframe.invalidated) {
        continue;
      }

      auto const &baselineShadowView = keyframe.viewStart;
      auto const &finalShadowView = keyframe.viewEnd;

      // The contract with the "keyframes generation" phase is that any animated
      // node will have a valid configuration.
      auto const layoutAnimationConfig = animation.layoutAnimationConfig;
      auto const &mutationConfig =
          (keyframe.type == AnimationConfigurationType::Delete
               ? layoutAnimationConfig.deleteConfig
               : (keyframe.type == AnimationConfigurationType::Create
                      ? layoutAnimationConfig.createConfig
                      : layoutAnimationConfig.updateConfig));

      // Interpolate
      std::pair<double, double> progress =
          calculateAnimationProgress(now, animation, mutationConfig);
      double animationTimeProgressLinear = progress.first;
      double animationInterpolationFactor = progress.second;

      auto mutatedShadowView = createInterpolatedShadowView(
          animationInterpolationFactor, baselineShadowView, finalShadowView);

      // Create the mutation instruction
      auto updateMutation = ShadowViewMutation::UpdateMutation(
          keyframe.viewPrev, mutatedShadowView);

      // All generated Update mutations must have an "old" and "new"
      // ShadowView. Checking for nonzero tag doesn't guarantee that the views
      // are valid/correct, just that something is there.
      react_native_assert(updateMutation.oldChildShadowView.tag > 0);
      react_native_assert(updateMutation.newChildShadowView.tag > 0);

      mutationsList.push_back(updateMutation);
      PrintMutationInstruction("Animation Progress:", updateMutation);

      keyframe.viewPrev = mutatedShadowView;

      if (animationTimeProgressLinear < 1) {
        incompleteAnimations++;
      }
    }

    // Are there no ongoing mutations left in this animation?
    if (incompleteAnimations == 0) {
      animation.completed = true;
    }
  }

  // Clear out finished animations
  for (auto it = inflightAnimations_.begin();
       it != inflightAnimations_.end();) {
    const auto &animation = *it;
    if (animation.completed) {
      callCallback(animation.successCallback);

      // Queue up "final" mutations for all keyframes in the completed animation
      for (auto const &keyframe : animation.keyFrames) {
        if (keyframe.invalidated) {
          continue;
        }
        queueFinalMutationsForCompletedKeyFrame(
            keyframe,
            mutationsList,
            false,
            "LayoutAnimationDriver: Animation Completed");
      }

      it = inflightAnimations_.erase(it);
    } else {
      it++;
    }
  }

  // Final step: make sure that all operations execute in the proper order.
  // REMOVE operations with highest indices must operate first.
  std::stable_sort(
      mutationsList.begin(),
      mutationsList.end(),
      &shouldFirstComeBeforeSecondMutation);
}

} // namespace react
} // namespace facebook
