/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LayoutAnimationDriver.h"

#include <algorithm>
#include <chrono>

#include <react/componentregistry/ComponentDescriptorFactory.h>
#include <react/components/root/RootShadowNode.h>
#include <react/components/view/ViewProps.h>
#include <react/core/ComponentDescriptor.h>
#include <react/core/LayoutMetrics.h>
#include <react/core/LayoutableShadowNode.h>
#include <react/core/Props.h>
#include <react/mounting/MountingCoordinator.h>

#include <react/mounting/Differentiator.h>
#include <react/mounting/ShadowTreeRevision.h>
#include <react/mounting/ShadowView.h>
#include <react/mounting/ShadowViewMutation.h>

#include <glog/logging.h>

namespace facebook {
namespace react {

static double
getProgressFromValues(double start, double end, double currentValue) {
  auto opacityMinmax = std::minmax({start, end});
  auto min = opacityMinmax.first;
  auto max = opacityMinmax.second;
  return (
      currentValue < min
          ? 0
          : (currentValue > max ? 0 : ((max - currentValue) / (max - min))));
}

/**
 * Given an animation and a ShadowView with properties set on it, detect how
 * far through the animation the ShadowView has progressed.
 *
 * @param mutationsList
 * @param now
 */
double LayoutAnimationDriver::getProgressThroughAnimation(
    AnimationKeyFrame const &keyFrame,
    LayoutAnimation const *layoutAnimation,
    ShadowView const &animationStateView) const {
  auto layoutAnimationConfig = layoutAnimation->layoutAnimationConfig;
  auto const mutationConfig =
      *(keyFrame.type == AnimationConfigurationType::Delete
            ? layoutAnimationConfig.deleteConfig
            : (keyFrame.type == AnimationConfigurationType::Create
                   ? layoutAnimationConfig.createConfig
                   : layoutAnimationConfig.updateConfig));

  auto initialProps = keyFrame.viewStart.props;
  auto finalProps = keyFrame.viewEnd.props;

  if (mutationConfig.animationProperty == AnimationProperty::Opacity) {
    // Detect progress through opacity animation.
    const auto &oldViewProps =
        dynamic_cast<const ViewProps *>(initialProps.get());
    const auto &newViewProps =
        dynamic_cast<const ViewProps *>(finalProps.get());
    const auto &animationStateViewProps =
        dynamic_cast<const ViewProps *>(animationStateView.props.get());
    if (oldViewProps != nullptr && newViewProps != nullptr &&
        animationStateViewProps != nullptr) {
      return getProgressFromValues(
          oldViewProps->opacity,
          newViewProps->opacity,
          animationStateViewProps->opacity);
    }
  } else if (
      mutationConfig.animationProperty != AnimationProperty::NotApplicable) {
    // Detect progress through layout animation.
    LayoutMetrics const &finalLayoutMetrics = keyFrame.viewEnd.layoutMetrics;
    LayoutMetrics const &baselineLayoutMetrics =
        keyFrame.viewStart.layoutMetrics;
    LayoutMetrics const &animationStateLayoutMetrics =
        animationStateView.layoutMetrics;

    if (baselineLayoutMetrics.frame.size.height !=
        finalLayoutMetrics.frame.size.height) {
      return getProgressFromValues(
          baselineLayoutMetrics.frame.size.height,
          finalLayoutMetrics.frame.size.height,
          animationStateLayoutMetrics.frame.size.height);
    }
    if (baselineLayoutMetrics.frame.size.width !=
        finalLayoutMetrics.frame.size.width) {
      return getProgressFromValues(
          baselineLayoutMetrics.frame.size.width,
          finalLayoutMetrics.frame.size.width,
          animationStateLayoutMetrics.frame.size.width);
    }
    if (baselineLayoutMetrics.frame.origin.x !=
        finalLayoutMetrics.frame.origin.x) {
      return getProgressFromValues(
          baselineLayoutMetrics.frame.origin.x,
          finalLayoutMetrics.frame.origin.x,
          animationStateLayoutMetrics.frame.origin.x);
    }
    if (baselineLayoutMetrics.frame.origin.y !=
        finalLayoutMetrics.frame.origin.y) {
      return getProgressFromValues(
          baselineLayoutMetrics.frame.origin.y,
          finalLayoutMetrics.frame.origin.y,
          animationStateLayoutMetrics.frame.origin.y);
    }
  }

  return 0;
}

void LayoutAnimationDriver::animationMutationsForFrame(
    SurfaceId surfaceId,
    ShadowViewMutation::List &mutationsList,
    uint64_t now) const {
  for (auto &animation : inflightAnimations_) {
    if (animation.surfaceId != surfaceId) {
      continue;
    }

    int incompleteAnimations = 0;
    for (const auto &keyframe : animation.keyFrames) {
      if (keyframe.type == AnimationConfigurationType::Noop) {
        continue;
      }

      auto const &baselineShadowView = keyframe.viewStart;
      auto const &finalShadowView = keyframe.viewEnd;

      // The contract with the "keyframes generation" phase is that any animated
      // node will have a valid configuration.
      auto const layoutAnimationConfig = animation.layoutAnimationConfig;
      auto const mutationConfig =
          (keyframe.type == AnimationConfigurationType::Delete
               ? layoutAnimationConfig.deleteConfig
               : (keyframe.type == AnimationConfigurationType::Create
                      ? layoutAnimationConfig.createConfig
                      : layoutAnimationConfig.updateConfig));

      // Interpolate
      std::pair<double, double> progress =
          calculateAnimationProgress(now, animation, *mutationConfig);
      double animationTimeProgressLinear = progress.first;
      double animationInterpolationFactor = progress.second;

      auto mutatedShadowView = createInterpolatedShadowView(
          animationInterpolationFactor,
          *mutationConfig,
          baselineShadowView,
          finalShadowView);

      // Create the mutation instruction
      mutationsList.push_back(ShadowViewMutation::UpdateMutation(
          keyframe.parentView, baselineShadowView, mutatedShadowView, -1));

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
      // Queue up "final" mutations for all keyframes in the completed animation
      for (auto const &keyframe : animation.keyFrames) {
        if (keyframe.finalMutationForKeyFrame.hasValue()) {
          mutationsList.push_back(*keyframe.finalMutationForKeyFrame);
        }
      }

      it = inflightAnimations_.erase(it);
    } else {
      it++;
    }
  }
}

} // namespace react
} // namespace facebook
