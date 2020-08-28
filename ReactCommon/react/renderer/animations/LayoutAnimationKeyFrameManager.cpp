/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LayoutAnimationKeyFrameManager.h"

#include <algorithm>
#include <chrono>

#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/mounting/MountingCoordinator.h>

#include <react/renderer/mounting/Differentiator.h>
#include <react/renderer/mounting/ShadowTreeRevision.h>
#include <react/renderer/mounting/ShadowView.h>

#include <glog/logging.h>

namespace facebook {
namespace react {

#ifdef LAYOUT_ANIMATION_VERBOSE_LOGGING
std::string GetMutationInstructionString(ShadowViewMutation const &mutation) {
  bool mutationIsRemove = mutation.type == ShadowViewMutation::Type::Remove;
  bool mutationIsInsert = mutation.type == ShadowViewMutation::Type::Insert;
  bool mutationIsDelete = mutation.type == ShadowViewMutation::Type::Delete;
  bool mutationIsCreate = mutation.type == ShadowViewMutation::Type::Create;
  std::string mutationType =
      (mutationIsRemove
           ? "REMOVE"
           : (mutationIsInsert
                  ? "INSERT"
                  : (mutationIsDelete
                         ? "DELETE"
                         : (mutationIsCreate ? "CREATE" : "UPDATE"))));
  return mutationType + " [" +
      std::to_string(
             mutationIsInsert || mutationIsCreate
                 ? mutation.newChildShadowView.tag
                 : mutation.oldChildShadowView.tag) +
      "]->[" + std::to_string(mutation.parentShadowView.tag) + "] @" +
      std::to_string(mutation.index);
}

void PrintMutationInstruction(
    std::string message,
    ShadowViewMutation const &mutation) {
  LOG(ERROR) << message
             << " Mutation: " << GetMutationInstructionString(mutation);
}
void PrintMutationInstructionRelative(
    std::string message,
    ShadowViewMutation const &mutation,
    ShadowViewMutation const &relativeMutation) {
  LOG(ERROR) << message
             << " Mutation: " << GetMutationInstructionString(mutation)
             << " RelativeMutation: "
             << GetMutationInstructionString(relativeMutation);
}
#endif

static better::optional<AnimationType> parseAnimationType(std::string param) {
  if (param == "spring") {
    return better::optional<AnimationType>(AnimationType::Spring);
  }
  if (param == "linear") {
    return better::optional<AnimationType>(AnimationType::Linear);
  }
  if (param == "easeInEaseOut") {
    return better::optional<AnimationType>(AnimationType::EaseInEaseOut);
  }
  if (param == "easeIn") {
    return better::optional<AnimationType>(AnimationType::EaseIn);
  }
  if (param == "easeOut") {
    return better::optional<AnimationType>(AnimationType::EaseOut);
  }
  if (param == "keyboard") {
    return better::optional<AnimationType>(AnimationType::Keyboard);
  }

  LOG(ERROR) << "Error parsing animation type: " << param;
  return {};
}

static better::optional<AnimationProperty> parseAnimationProperty(
    std::string param) {
  if (param == "opacity") {
    return better::optional<AnimationProperty>(AnimationProperty::Opacity);
  }
  if (param == "scaleX") {
    return better::optional<AnimationProperty>(AnimationProperty::ScaleX);
  }
  if (param == "scaleY") {
    return better::optional<AnimationProperty>(AnimationProperty::ScaleY);
  }
  if (param == "scaleXY") {
    return better::optional<AnimationProperty>(AnimationProperty::ScaleXY);
  }

  LOG(ERROR) << "Error parsing animation property: " << param;
  return {};
}

static better::optional<AnimationConfig> parseAnimationConfig(
    folly::dynamic const &config,
    double defaultDuration,
    bool parsePropertyType) {
  if (config.empty() || !config.isObject()) {
    return better::optional<AnimationConfig>(
        AnimationConfig{AnimationType::Linear,
                        AnimationProperty::NotApplicable,
                        defaultDuration,
                        0,
                        0,
                        0});
  }

  auto const typeIt = config.find("type");
  if (typeIt == config.items().end()) {
    LOG(ERROR) << "Error parsing animation config: could not find field `type`";
    return {};
  }
  auto const animationTypeParam = typeIt->second;
  if (animationTypeParam.empty() || !animationTypeParam.isString()) {
    LOG(ERROR)
        << "Error parsing animation config: could not unwrap field `type`";
    return {};
  }
  const auto animationType = parseAnimationType(animationTypeParam.asString());
  if (!animationType) {
    LOG(ERROR)
        << "Error parsing animation config: could not parse field `type`";
    return {};
  }

  AnimationProperty animationProperty = AnimationProperty::NotApplicable;
  if (parsePropertyType) {
    auto const propertyIt = config.find("property");
    if (propertyIt == config.items().end()) {
      LOG(ERROR)
          << "Error parsing animation config: could not find field `property`";
      return {};
    }
    auto const animationPropertyParam = propertyIt->second;
    if (animationPropertyParam.empty() || !animationPropertyParam.isString()) {
      LOG(ERROR)
          << "Error parsing animation config: could not unwrap field `property`";
      return {};
    }
    const auto animationPropertyParsed =
        parseAnimationProperty(animationPropertyParam.asString());
    if (!animationPropertyParsed) {
      LOG(ERROR)
          << "Error parsing animation config: could not parse field `property`";
      return {};
    }
    animationProperty = *animationPropertyParsed;
  }

  double duration = defaultDuration;
  double delay = 0;
  double springDamping = 0.5;
  double initialVelocity = 0;

  auto const durationIt = config.find("duration");
  if (durationIt != config.items().end()) {
    if (durationIt->second.isDouble()) {
      duration = durationIt->second.asDouble();
    } else {
      LOG(ERROR)
          << "Error parsing animation config: field `duration` must be a number";
      return {};
    }
  }

  auto const delayIt = config.find("delay");
  if (delayIt != config.items().end()) {
    if (delayIt->second.isDouble()) {
      delay = delayIt->second.asDouble();
    } else {
      LOG(ERROR)
          << "Error parsing animation config: field `delay` must be a number";
      return {};
    }
  }

  auto const springDampingIt = config.find("springDamping");
  if (springDampingIt != config.items().end() &&
      springDampingIt->second.isDouble()) {
    if (springDampingIt->second.isDouble()) {
      springDamping = springDampingIt->second.asDouble();
    } else {
      LOG(ERROR)
          << "Error parsing animation config: field `springDamping` must be a number";
      return {};
    }
  }

  auto const initialVelocityIt = config.find("initialVelocity");
  if (initialVelocityIt != config.items().end()) {
    if (initialVelocityIt->second.isDouble()) {
      initialVelocity = initialVelocityIt->second.asDouble();
    } else {
      LOG(ERROR)
          << "Error parsing animation config: field `initialVelocity` must be a number";
      return {};
    }
  }

  return better::optional<AnimationConfig>(AnimationConfig{*animationType,
                                                           animationProperty,
                                                           duration,
                                                           delay,
                                                           springDamping,
                                                           initialVelocity});
}

// Parse animation config from JS
static better::optional<LayoutAnimationConfig> parseLayoutAnimationConfig(
    folly::dynamic const &config) {
  if (config.empty() || !config.isObject()) {
    return {};
  }

  const auto durationIt = config.find("duration");
  if (durationIt == config.items().end() || !durationIt->second.isDouble()) {
    return {};
  }
  const double duration = durationIt->second.asDouble();

  const auto createConfigIt = config.find("create");
  const auto createConfig = createConfigIt == config.items().end()
      ? better::optional<AnimationConfig>(AnimationConfig{})
      : parseAnimationConfig(createConfigIt->second, duration, true);

  const auto updateConfigIt = config.find("update");
  const auto updateConfig = updateConfigIt == config.items().end()
      ? better::optional<AnimationConfig>(AnimationConfig{})
      : parseAnimationConfig(updateConfigIt->second, duration, false);

  const auto deleteConfigIt = config.find("delete");
  const auto deleteConfig = deleteConfigIt == config.items().end()
      ? better::optional<AnimationConfig>(AnimationConfig{})
      : parseAnimationConfig(deleteConfigIt->second, duration, true);

  if (!createConfig || !updateConfig || !deleteConfig) {
    return {};
  }

  return better::optional<LayoutAnimationConfig>(LayoutAnimationConfig{
      duration, *createConfig, *updateConfig, *deleteConfig});
}

/**
 * Globally configure next LayoutAnimation.
 * This is guaranteed to be called only on the JS thread.
 */
void LayoutAnimationKeyFrameManager::uiManagerDidConfigureNextLayoutAnimation(
    jsi::Runtime &runtime,
    RawValue const &config,
    const jsi::Value &successCallbackValue,
    const jsi::Value &failureCallbackValue) const {
  bool hasSuccessCallback = successCallbackValue.isObject() &&
      successCallbackValue.getObject(runtime).isFunction(runtime);
  bool hasFailureCallback = failureCallbackValue.isObject() &&
      failureCallbackValue.getObject(runtime).isFunction(runtime);
  LayoutAnimationCallbackWrapper successCallback = hasSuccessCallback
      ? LayoutAnimationCallbackWrapper(
            successCallbackValue.getObject(runtime).getFunction(runtime))
      : LayoutAnimationCallbackWrapper();
  LayoutAnimationCallbackWrapper failureCallback = hasFailureCallback
      ? LayoutAnimationCallbackWrapper(
            failureCallbackValue.getObject(runtime).getFunction(runtime))
      : LayoutAnimationCallbackWrapper();

  auto layoutAnimationConfig =
      parseLayoutAnimationConfig((folly::dynamic)config);

  if (layoutAnimationConfig) {
    std::lock_guard<std::mutex> lock(currentAnimationMutex_);

    currentAnimation_ = better::optional<LayoutAnimation>{
        LayoutAnimation{-1,
                        0,
                        false,
                        *layoutAnimationConfig,
                        successCallback,
                        failureCallback,
                        {}}};
  } else {
    LOG(ERROR) << "Parsing LayoutAnimationConfig failed: "
               << (folly::dynamic)config;

    callCallback(failureCallback);
  }
}

void LayoutAnimationKeyFrameManager::setLayoutAnimationStatusDelegate(
    LayoutAnimationStatusDelegate *delegate) const {
  std::lock_guard<std::mutex> lock(layoutAnimationStatusDelegateMutex_);
  layoutAnimationStatusDelegate_ = delegate;
}

bool LayoutAnimationKeyFrameManager::shouldOverridePullTransaction() const {
  return shouldAnimateFrame();
}

void LayoutAnimationKeyFrameManager::stopSurface(SurfaceId surfaceId) {
  std::lock_guard<std::mutex> lock(surfaceIdsToStopMutex_);
  surfaceIdsToStop_.push_back(surfaceId);
}

bool LayoutAnimationKeyFrameManager::shouldAnimateFrame() const {
  // There is potentially a race here between getting and setting
  // `currentMutation_`. We don't want to lock around this because then we're
  // creating contention between pullTransaction and the JS thread.
  return currentAnimation_ || !inflightAnimations_.empty();
}

static inline const float
interpolateFloats(float coefficient, float oldValue, float newValue) {
  return oldValue + (newValue - oldValue) * coefficient;
}

std::pair<double, double>
LayoutAnimationKeyFrameManager::calculateAnimationProgress(
    uint64_t now,
    const LayoutAnimation &animation,
    const AnimationConfig &mutationConfig) const {
  if (mutationConfig.animationType == AnimationType::None) {
    return {1, 1};
  }

  uint64_t startTime = animation.startTime;
  uint64_t delay = mutationConfig.delay;
  uint64_t endTime = startTime + delay + mutationConfig.duration;

  static const float PI = 3.14159265358979323846;

  if (now >= endTime) {
    return {1, 1};
  }
  if (now < startTime + delay) {
    return {0, 0};
  }

  double linearTimeProgression = 1 -
      (double)(endTime - delay - now) / (double)(endTime - animation.startTime);

  if (mutationConfig.animationType == AnimationType::Linear) {
    return {linearTimeProgression, linearTimeProgression};
  } else if (mutationConfig.animationType == AnimationType::EaseIn) {
    // This is an accelerator-style interpolator.
    // In the future, this parameter (2.0) could be adjusted. This has been the
    // default for Classic RN forever.
    return {linearTimeProgression, pow(linearTimeProgression, 2.0)};
  } else if (mutationConfig.animationType == AnimationType::EaseOut) {
    // This is an decelerator-style interpolator.
    // In the future, this parameter (2.0) could be adjusted. This has been the
    // default for Classic RN forever.
    return {linearTimeProgression, 1.0 - pow(1 - linearTimeProgression, 2.0)};
  } else if (mutationConfig.animationType == AnimationType::EaseInEaseOut) {
    // This is a combination of accelerate+decelerate.
    // The animation starts and ends slowly, and speeds up in the middle.
    return {linearTimeProgression,
            cos((linearTimeProgression + 1.0) * PI) / 2 + 0.5};
  } else if (mutationConfig.animationType == AnimationType::Spring) {
    // Using mSpringDamping in this equation is not really the exact
    // mathematical springDamping, but a good approximation We need to replace
    // this equation with the right Factor that accounts for damping and
    // friction
    double damping = mutationConfig.springDamping;
    return {
        linearTimeProgression,
        (1 +
         pow(2, -10 * linearTimeProgression) *
             sin((linearTimeProgression - damping / 4) * PI * 2 / damping))};
  } else {
    return {linearTimeProgression, linearTimeProgression};
  }
}

void LayoutAnimationKeyFrameManager::
    adjustImmediateMutationIndicesForDelayedMutations(
        SurfaceId surfaceId,
        ShadowViewMutation &mutation,
        ShadowViewMutationList *auxiliaryMutations) const {
  bool isRemoveMutation = mutation.type == ShadowViewMutation::Type::Remove;
  assert(isRemoveMutation || mutation.type == ShadowViewMutation::Type::Insert);

  // TODO: turn all of this into a lambda and share code?
  if (mutatedViewIsVirtual(mutation)) {
    PrintMutationInstruction(
        "[IndexAdjustment] Not calling adjustImmediateMutationIndicesForDelayedMutations, is virtual, for:",
        mutation);
    return;
  }

  PrintMutationInstruction(
      "[IndexAdjustment] Calling adjustImmediateMutationIndicesForDelayedMutations for:",
      mutation);

  // First, collect all final mutations that could impact this immediate
  // mutation.
  std::vector<ShadowViewMutation *> candidateMutations{};

  if (auxiliaryMutations != nullptr) {
    for (auto &auxMutation : *auxiliaryMutations) {
      if (auxMutation.parentShadowView.tag != mutation.parentShadowView.tag) {
        continue;
      }
      if (auxMutation.type != ShadowViewMutation::Type::Remove) {
        continue;
      }
      if (mutatedViewIsVirtual(auxMutation)) {
        continue;
      }
      if (auxMutation.oldChildShadowView.tag ==
          (isRemoveMutation ? mutation.oldChildShadowView.tag
                            : mutation.newChildShadowView.tag)) {
        continue;
      }

      PrintMutationInstructionRelative(
          "[IndexAdjustment] adjustImmediateMutationIndicesForDelayedMutations auxiliary CANDIDATE for:",
          mutation,
          auxMutation);
      candidateMutations.push_back(&auxMutation);
    }
  }

  for (auto &inflightAnimation : inflightAnimations_) {
    if (inflightAnimation.surfaceId != surfaceId) {
      continue;
    }
    if (inflightAnimation.completed) {
      continue;
    }

    for (auto it = inflightAnimation.keyFrames.begin();
         it != inflightAnimation.keyFrames.end();
         it++) {
      auto &animatedKeyFrame = *it;

      if (animatedKeyFrame.invalidated) {
        continue;
      }

      // Detect if they're in the same view hierarchy, but not equivalent
      // (We've already detected direct conflicts and handled them above)
      if (animatedKeyFrame.parentView.tag != mutation.parentShadowView.tag) {
        continue;
      }

      if (animatedKeyFrame.type != AnimationConfigurationType::Noop) {
        continue;
      }
      if (!animatedKeyFrame.finalMutationForKeyFrame.has_value()) {
        continue;
      }

      auto &delayedMutation = *animatedKeyFrame.finalMutationForKeyFrame;

      if (delayedMutation.type != ShadowViewMutation::Type::Remove) {
        continue;
      }
      if (mutatedViewIsVirtual(delayedMutation)) {
        continue;
      }
      if (delayedMutation.oldChildShadowView.tag ==
          (isRemoveMutation ? mutation.oldChildShadowView.tag
                            : mutation.newChildShadowView.tag)) {
        continue;
      }

      PrintMutationInstructionRelative(
          "[IndexAdjustment] adjustImmediateMutationIndicesForDelayedMutations CANDIDATE for:",
          mutation,
          delayedMutation);
      candidateMutations.push_back(&delayedMutation);
    }
  }

  // While the mutation keeps being affected, keep checking. We use the vector
  // so we only perform one adjustment per delayed mutation. See comments at
  // bottom of adjustDelayedMutationIndicesForMutation for further explanation.
  bool changed = true;
  while (changed) {
    changed = false;
    candidateMutations.erase(
        std::remove_if(
            candidateMutations.begin(),
            candidateMutations.end(),
            [&mutation, &changed](ShadowViewMutation *candidateMutation) {
              if (candidateMutation->index <= mutation.index) {
                mutation.index++;
                changed = true;
                PrintMutationInstructionRelative(
                    "[IndexAdjustment] adjustImmediateMutationIndicesForDelayedMutations: Adjusting mutation UPWARD",
                    mutation,
                    *candidateMutation);
                return true;
              }
              return false;
            }),
        candidateMutations.end());
  }
}

void LayoutAnimationKeyFrameManager::
    adjustLastAnimationDelayedMutationIndicesForMutation(
        SurfaceId surfaceId,
        ShadowViewMutation const &mutation) const {
  adjustDelayedMutationIndicesForMutation(surfaceId, mutation, true);
}

void LayoutAnimationKeyFrameManager::adjustDelayedMutationIndicesForMutation(
    SurfaceId surfaceId,
    ShadowViewMutation const &mutation,
    bool lastAnimationOnly) const {
  bool isRemoveMutation = mutation.type == ShadowViewMutation::Type::Remove;
  bool isInsertMutation = mutation.type == ShadowViewMutation::Type::Insert;
  assert(isRemoveMutation || isInsertMutation);

  if (mutatedViewIsVirtual(mutation)) {
    PrintMutationInstruction(
        "[IndexAdjustment] Not calling adjustDelayedMutationIndicesForMutation, is virtual, for:",
        mutation);
    return;
  }

  // First, collect all final mutations that could impact this immediate
  // mutation.
  std::vector<ShadowViewMutation *> candidateMutations{};

  for (auto inflightAnimationIt = inflightAnimations_.rbegin();
       inflightAnimationIt != inflightAnimations_.rend();
       inflightAnimationIt++) {
    auto &inflightAnimation = *inflightAnimationIt;

    if (inflightAnimation.surfaceId != surfaceId) {
      continue;
    }
    if (inflightAnimation.completed) {
      continue;
    }

    for (auto it = inflightAnimation.keyFrames.begin();
         it != inflightAnimation.keyFrames.end();
         it++) {
      auto &animatedKeyFrame = *it;

      if (animatedKeyFrame.invalidated) {
        continue;
      }

      // Detect if they're in the same view hierarchy, but not equivalent
      // (We've already detected direct conflicts and handled them above)
      if (animatedKeyFrame.parentView.tag != mutation.parentShadowView.tag) {
        continue;
      }

      if (animatedKeyFrame.type != AnimationConfigurationType::Noop) {
        continue;
      }
      if (!animatedKeyFrame.finalMutationForKeyFrame.has_value()) {
        continue;
      }
      ShadowViewMutation &finalAnimationMutation =
          *animatedKeyFrame.finalMutationForKeyFrame;

      if (finalAnimationMutation.oldChildShadowView.tag ==
          (isRemoveMutation ? mutation.oldChildShadowView.tag
                            : mutation.newChildShadowView.tag)) {
        continue;
      }

      if (!mutatedViewIsVirtual(*animatedKeyFrame.finalMutationForKeyFrame) &&
          finalAnimationMutation.type == ShadowViewMutation::Type::Remove) {
        PrintMutationInstructionRelative(
            "[IndexAdjustment] adjustDelayedMutationIndicesForMutation: CANDIDATE:",
            mutation,
            *animatedKeyFrame.finalMutationForKeyFrame);
        candidateMutations.push_back(
            animatedKeyFrame.finalMutationForKeyFrame.get_pointer());
      }
    }

    if (lastAnimationOnly) {
      break;
    }
  }

  // Because the finalAnimations are not sorted in any way, it is possible to
  // have some sequence like:
  // * DELAYED REMOVE 10 from {TAG}
  // * DELAYED REMOVE 9 from {TAG}
  // * ...
  // * DELAYED REMOVE 5 from {TAG}
  // with mutation: INSERT 6/REMOVE 6. This would cause the first few mutations
  // to *not* be adjusted, even though they would be impacted by mutation or
  // vice-versa after later adjustments are applied. Therefore, we just keep
  // recursing while there are any changes. This isn't great, but is good enough
  // for now until we change these data-structures.
  bool changed = true;
  while (changed) {
    changed = false;
    candidateMutations.erase(
        std::remove_if(
            candidateMutations.begin(),
            candidateMutations.end(),
            [&mutation, &isRemoveMutation, &isInsertMutation, &changed](
                ShadowViewMutation *candidateMutation) {
              if (isRemoveMutation &&
                  mutation.index <= candidateMutation->index) {
                candidateMutation->index--;
                changed = true;
                PrintMutationInstructionRelative(
                    "[IndexAdjustment] adjustDelayedMutationIndicesForMutation: Adjusting mutation DOWNWARD",
                    mutation,
                    *candidateMutation);
                return true;
              } else if (
                  isInsertMutation &&
                  mutation.index <= candidateMutation->index) {
                candidateMutation->index++;
                changed = true;
                PrintMutationInstructionRelative(
                    "[IndexAdjustment] adjustDelayedMutationIndicesForMutation: Adjusting mutation UPWARD",
                    mutation,
                    *candidateMutation);
                return true;
              }
              return false;
            }),
        candidateMutations.end());
  }
}

std::vector<std::tuple<AnimationKeyFrame, AnimationConfig, LayoutAnimation *>>
LayoutAnimationKeyFrameManager::getAndEraseConflictingAnimations(
    SurfaceId surfaceId,
    ShadowViewMutationList &mutations,
    bool deletesOnly) const {
  std::vector<std::tuple<AnimationKeyFrame, AnimationConfig, LayoutAnimation *>>
      conflictingAnimations{};

  for (auto &mutation : mutations) {
    if (deletesOnly && mutation.type != ShadowViewMutation::Type::Delete) {
      continue;
    }
    PrintMutationInstruction("getAndEraseConflictingAnimations of: ", mutation);

    auto const &baselineShadowView =
        (mutation.type == ShadowViewMutation::Type::Insert ||
         mutation.type == ShadowViewMutation::Type::Create)
        ? mutation.newChildShadowView
        : mutation.oldChildShadowView;

    for (auto &inflightAnimation : inflightAnimations_) {
      if (inflightAnimation.surfaceId != surfaceId) {
        continue;
      }
      if (inflightAnimation.completed) {
        continue;
      }

      for (auto it = inflightAnimation.keyFrames.begin();
           it != inflightAnimation.keyFrames.end();) {
        auto &animatedKeyFrame = *it;

        if (animatedKeyFrame.invalidated) {
          continue;
        }

        //        bool hasFinalMutation =
        //            animatedKeyFrame.finalMutationForKeyFrame.hasValue();
        //        int finalMutationTag = hasFinalMutation
        //            ? (((*animatedKeyFrame.finalMutationForKeyFrame).type ==
        //                    ShadowViewMutation::Create ||
        //                (*animatedKeyFrame.finalMutationForKeyFrame).type ==
        //                    ShadowViewMutation::Insert)
        //                   ? (*animatedKeyFrame.finalMutationForKeyFrame)
        //                         .newChildShadowView.tag
        //                   : (*animatedKeyFrame.finalMutationForKeyFrame)
        //                         .oldChildShadowView.tag)
        //            : -1;
        bool conflicting = animatedKeyFrame.tag == baselineShadowView.tag ||
            ((mutation.type == ShadowViewMutation::Type::Delete ||
              mutation.type == ShadowViewMutation::Type::Create) &&
             animatedKeyFrame.parentView.tag == baselineShadowView.tag) /* ||
             finalMutationTag == baselineShadowView.tag*/
            ;

        // In some bizarre situations, there can be an ongoing Delete
        // animation, and then a conflicting mutation to create and/or delete
        // the same tag. In actuality this "bizarre" situation is just the
        // animation of repeatedly flattening and unflattening a view; but
        // it's not clear how to gracefully recover from this, so we just
        // ensure that the Deletion is never executed in those cases. In these
        // cases, the ongoing animation will stop; the view still exists; and
        // then either a "Create" or "delete" animation will be recreated and
        // executed for that tag.
        bool shouldExecuteFinalMutation =
            !(animatedKeyFrame.finalMutationForKeyFrame.hasValue() &&
              (*animatedKeyFrame.finalMutationForKeyFrame).type ==
                  ShadowViewMutation::Delete);

        // Conflicting animation detected: if we're mutating a tag under
        // animation, or deleting the parent of a tag under animation, or
        // reparenting.
        if (conflicting) {
          auto const layoutAnimationConfig =
              inflightAnimation.layoutAnimationConfig;

          auto const mutationConfig =
              (animatedKeyFrame.type == AnimationConfigurationType::Delete
                   ? layoutAnimationConfig.deleteConfig
                   : (animatedKeyFrame.type ==
                              AnimationConfigurationType::Create
                          ? layoutAnimationConfig.createConfig
                          : layoutAnimationConfig.updateConfig));

          animatedKeyFrame.invalidated = true;

          if (shouldExecuteFinalMutation) {
            conflictingAnimations.push_back(std::make_tuple(
                animatedKeyFrame, *mutationConfig, &inflightAnimation));
          }

#ifdef LAYOUT_ANIMATION_VERBOSE_LOGGING
          if (animatedKeyFrame.finalMutationForKeyFrame.has_value()) {
            PrintMutationInstructionRelative(
                "Found mutation that conflicts with existing in-flight animation:",
                mutation,
                *animatedKeyFrame.finalMutationForKeyFrame);
          } else {
            PrintMutationInstruction(
                "Found mutation that conflicts with existing in-flight animation:",
                mutation);
          }
#endif

          // Delete from existing animation
          it = inflightAnimation.keyFrames.erase(it);
        } else {
          //#ifdef LAYOUT_ANIMATION_VERBOSE_LOGGING
          //          if (hasFinalMutation) {
          //            PrintMutationInstructionRelative("getAndEraseConflictingAnimations,
          //            NOT erasing non-conflicting mutation of ", mutation,
          //            *animatedKeyFrame.finalMutationForKeyFrame);
          //          }
          //#endif
          it++;
        }
      }
    }
  }

  return conflictingAnimations;
}

better::optional<MountingTransaction>
LayoutAnimationKeyFrameManager::pullTransaction(
    SurfaceId surfaceId,
    MountingTransaction::Number transactionNumber,
    TransactionTelemetry const &telemetry,
    ShadowViewMutationList mutations) const {
  // Current time in milliseconds
  uint64_t now =
      std::chrono::duration_cast<std::chrono::milliseconds>(
          std::chrono::high_resolution_clock::now().time_since_epoch())
          .count();

  bool inflightAnimationsExistInitially = !inflightAnimations_.empty();

  // Execute stopSurface on any ongoing animations
  if (inflightAnimationsExistInitially) {
    std::vector<SurfaceId> surfaceIdsToStop{};
    {
      std::lock_guard<std::mutex> lock(surfaceIdsToStopMutex_);
      surfaceIdsToStop = surfaceIdsToStop_;
      surfaceIdsToStop_ = {};
    }

    for (auto it = inflightAnimations_.begin();
         it != inflightAnimations_.end();) {
      const auto &animation = *it;

      if (std::find(
              surfaceIdsToStop.begin(),
              surfaceIdsToStop.end(),
              animation.surfaceId) != surfaceIdsToStop.end()) {
#ifdef LAYOUT_ANIMATION_VERBOSE_LOGGING
        LOG(ERROR)
            << "LayoutAnimations: stopping animation due to stopSurface on "
            << surfaceId;
#endif
        it = inflightAnimations_.erase(it);
      } else {
        it++;
      }
    }
  }

  if (!mutations.empty()) {
#ifdef RN_SHADOW_TREE_INTROSPECTION
    {
      std::stringstream ss(getDebugDescription(mutations, {}));
      std::string to;
      while (std::getline(ss, to, '\n')) {
        LOG(ERROR)
            << "LayoutAnimationKeyFrameManager.cpp: got mutation list: Line: "
            << to;
      }
    };
#endif

      // DEBUG ONLY: list existing inflight animations
#ifdef LAYOUT_ANIMATION_VERBOSE_LOGGING
    LOG(ERROR) << "BEGINNING DISPLAYING ONGOING inflightAnimations_!";
    int i = 0;
    int j = 0;
    for (auto &inflightAnimation : inflightAnimations_) {
      i++;
      j = 0;
      if (inflightAnimation.completed) {
        continue;
      }
      for (auto &keyframe : inflightAnimation.keyFrames) {
        j++;
        if (keyframe.invalidated) {
          continue;
        }
        if (keyframe.finalMutationForKeyFrame) {
          std::string msg = "Animation " + std::to_string(i) + " keyframe " +
              std::to_string(j) + ": Final Animation";
          PrintMutationInstruction(msg, *keyframe.finalMutationForKeyFrame);
        } else {
          LOG(ERROR) << "Animation " << i << " keyframe " << j << ": on tag: ["
                     << keyframe.viewStart.tag << "]";
        }
      }
    }
    LOG(ERROR) << "BEGINNING DONE DISPLAYING ONGOING inflightAnimations_!";
#endif

    // What to do if we detect a conflict? Get current value and make
    // that the baseline of the next animation. Scale the remaining time
    // in the animation
    // Types of conflicts and how we handle them:
    // Update -> update: remove the previous update, make it the baseline of the
    // next update (with current progress) Update -> remove: same, with final
    // mutation being a remove Insert -> update: treat as update->update Insert
    // -> remove: same, as update->remove Remove -> update/insert: not possible
    // We just collect pairs here of <Mutation, AnimationConfig> and delete them
    // from active animations. If another animation is queued up from the
    // current mutations then these deleted mutations will serve as the baseline
    // for the next animation. If not, the current mutations are executed
    // immediately without issues.
    std::vector<
        std::tuple<AnimationKeyFrame, AnimationConfig, LayoutAnimation *>>
        conflictingAnimations =
            getAndEraseConflictingAnimations(surfaceId, mutations);

    // Are we animating this list of mutations?
    better::optional<LayoutAnimation> currentAnimation{};
    {
      std::lock_guard<std::mutex> lock(currentAnimationMutex_);
      if (currentAnimation_) {
        currentAnimation = std::move(currentAnimation_);
        currentAnimation_ = {};
      }
    }

    if (currentAnimation) {
      LayoutAnimation animation = std::move(currentAnimation.value());
      currentAnimation = {};
      animation.surfaceId = surfaceId;
      animation.startTime = now;

      // Pre-process list to:
      //   Catch remove+reinsert (reorders)
      //   Catch delete+create (reparenting) (this should be optimized away at
      //   the diffing level eventually?)
      // TODO: to prevent this step we could tag Remove/Insert mutations as
      // being moves on the Differ level, since we know that there? We could use
      // TinyMap here, but it's not exposed by Differentiator (yet).
      std::vector<Tag> insertedTags;
      std::vector<Tag> createdTags;
      std::unordered_map<Tag, ShadowViewMutation> movedTags;
      std::vector<Tag> reparentedTags;
      for (const auto &mutation : mutations) {
        if (mutation.type == ShadowViewMutation::Type::Insert) {
          insertedTags.push_back(mutation.newChildShadowView.tag);
        }
        if (mutation.type == ShadowViewMutation::Type::Create) {
          createdTags.push_back(mutation.newChildShadowView.tag);
        }
      }

      // Process mutations list into operations that can be sent to platform
      // immediately, and those that need to be animated Deletions, removals,
      // updates are delayed and animated. Creations and insertions are sent to
      // platform and then "animated in" with opacity updates. Upon completion,
      // removals and deletions are sent to platform
      ShadowViewMutation::List immediateMutations;

      // Remove operations that are actually moves should be copied to
      // "immediate mutations". The corresponding "insert" will also be executed
      // immediately and animated as an update.
      std::vector<AnimationKeyFrame> keyFramesToAnimate;
      std::vector<AnimationKeyFrame> movesToAnimate;
      auto const layoutAnimationConfig = animation.layoutAnimationConfig;
      for (auto &mutation : mutations) {
        ShadowView baselineShadowView =
            (mutation.type == ShadowViewMutation::Type::Delete ||
                     mutation.type == ShadowViewMutation::Type::Remove
                 ? mutation.oldChildShadowView
                 : mutation.newChildShadowView);
        bool haveComponentDescriptor =
            hasComponentDescriptorForShadowView(baselineShadowView);

        bool executeMutationImmediately = false;

        auto mutationConfig =
            (mutation.type == ShadowViewMutation::Type::Delete
                 ? layoutAnimationConfig.deleteConfig
                 : (mutation.type == ShadowViewMutation::Type::Insert
                        ? layoutAnimationConfig.createConfig
                        : layoutAnimationConfig.updateConfig));

        bool isRemoveReinserted =
            mutation.type == ShadowViewMutation::Type::Remove &&
            std::find(
                insertedTags.begin(),
                insertedTags.end(),
                mutation.oldChildShadowView.tag) != insertedTags.end();

        // Reparenting can result in a node being removed, inserted (moved) and
        // also deleted and created in the same frame, with the same props etc.
        // This should eventually be optimized out of the diffing algorithm, but
        // for now we detect reparenting and prevent the corresponding
        // Delete/Create instructions from being animated.
        bool isReparented =
            (mutation.type == ShadowViewMutation::Delete &&
             std::find(
                 createdTags.begin(),
                 createdTags.end(),
                 mutation.oldChildShadowView.tag) != createdTags.end()) ||
            (mutation.type == ShadowViewMutation::Create &&
             std::find(
                 reparentedTags.begin(),
                 reparentedTags.end(),
                 mutation.newChildShadowView.tag) != reparentedTags.end());

        if (isRemoveReinserted) {
          movedTags.insert({mutation.oldChildShadowView.tag, mutation});
        }

        if (isReparented && mutation.type == ShadowViewMutation::Delete) {
          reparentedTags.push_back(mutation.oldChildShadowView.tag);
        }

        // Inserts that follow a "remove" of the same tag should be treated as
        // an update (move) animation.
        bool wasInsertedTagRemoved = false;
        bool haveConfiguration = mutationConfig.has_value();
        if (mutation.type == ShadowViewMutation::Type::Insert) {
          // If this is a move, we actually don't want to copy this insert
          // instruction to animated instructions - we want to
          // generate an Update mutation for Remove+Insert pairs to animate
          // the layout.
          // The corresponding Remove and Insert instructions will instead
          // be treated as "immediate" instructions.
          auto movedIt = movedTags.find(mutation.newChildShadowView.tag);
          wasInsertedTagRemoved = movedIt != movedTags.end();
          if (wasInsertedTagRemoved) {
            mutationConfig = layoutAnimationConfig.updateConfig;
          }
          haveConfiguration = mutationConfig.has_value();

          if (wasInsertedTagRemoved && haveConfiguration) {
            movesToAnimate.push_back(
                AnimationKeyFrame{{},
                                  AnimationConfigurationType::Update,
                                  mutation.newChildShadowView.tag,
                                  mutation.parentShadowView,
                                  movedIt->second.oldChildShadowView,
                                  mutation.newChildShadowView});
          }
        }

        // Creates and inserts should also be executed immediately.
        // Mutations that would otherwise be animated, but have no
        // configuration, are also executed immediately.
        if (isRemoveReinserted || !haveConfiguration || isReparented ||
            mutation.type == ShadowViewMutation::Type::Create ||
            mutation.type == ShadowViewMutation::Type::Insert) {
          executeMutationImmediately = true;
        }

        // Deletes, non-move inserts, updates get animated
        if (!wasInsertedTagRemoved && !isRemoveReinserted && !isReparented &&
            haveConfiguration &&
            mutation.type != ShadowViewMutation::Type::Create) {
          ShadowView viewStart = ShadowView(
              mutation.type == ShadowViewMutation::Type::Insert
                  ? mutation.newChildShadowView
                  : mutation.oldChildShadowView);
          ShadowView viewFinal = ShadowView(
              mutation.type == ShadowViewMutation::Type::Update
                  ? mutation.newChildShadowView
                  : viewStart);
          ShadowView parent = mutation.parentShadowView;
          Tag tag = viewStart.tag;

          AnimationKeyFrame keyFrame{};
          if (mutation.type == ShadowViewMutation::Type::Insert) {
            if (mutationConfig->animationProperty ==
                    AnimationProperty::Opacity &&
                haveComponentDescriptor) {
              auto props =
                  getComponentDescriptorForShadowView(baselineShadowView)
                      .cloneProps(viewStart.props, {});
              const auto viewProps =
                  dynamic_cast<const ViewProps *>(props.get());
              if (viewProps != nullptr) {
                const_cast<ViewProps *>(viewProps)->opacity = 0;
              }
              viewStart.props = props;
            }
            bool isScaleX = mutationConfig->animationProperty ==
                    AnimationProperty::ScaleX ||
                mutationConfig->animationProperty == AnimationProperty::ScaleXY;
            bool isScaleY = mutationConfig->animationProperty ==
                    AnimationProperty::ScaleY ||
                mutationConfig->animationProperty == AnimationProperty::ScaleXY;
            if ((isScaleX || isScaleY) && haveComponentDescriptor) {
              auto props =
                  getComponentDescriptorForShadowView(baselineShadowView)
                      .cloneProps(viewStart.props, {});
              const auto viewProps =
                  dynamic_cast<const ViewProps *>(props.get());
              if (viewProps != nullptr) {
                const_cast<ViewProps *>(viewProps)->transform =
                    Transform::Scale(isScaleX ? 0 : 1, isScaleY ? 0 : 1, 1);
              }
              viewStart.props = props;
            }

            keyFrame = AnimationKeyFrame{{},
                                         AnimationConfigurationType::Create,
                                         tag,
                                         parent,
                                         viewStart,
                                         viewFinal,
                                         0};
          } else if (mutation.type == ShadowViewMutation::Type::Delete) {
            if (mutationConfig->animationProperty ==
                    AnimationProperty::Opacity &&
                haveComponentDescriptor) {
              auto props =
                  getComponentDescriptorForShadowView(baselineShadowView)
                      .cloneProps(viewFinal.props, {});
              const auto viewProps =
                  dynamic_cast<const ViewProps *>(props.get());
              if (viewProps != nullptr) {
                const_cast<ViewProps *>(viewProps)->opacity = 0;
              }
              viewFinal.props = props;
            }
            bool isScaleX = mutationConfig->animationProperty ==
                    AnimationProperty::ScaleX ||
                mutationConfig->animationProperty == AnimationProperty::ScaleXY;
            bool isScaleY = mutationConfig->animationProperty ==
                    AnimationProperty::ScaleY ||
                mutationConfig->animationProperty == AnimationProperty::ScaleXY;
            if ((isScaleX || isScaleY) && haveComponentDescriptor) {
              auto props =
                  getComponentDescriptorForShadowView(baselineShadowView)
                      .cloneProps(viewFinal.props, {});
              const auto viewProps =
                  dynamic_cast<const ViewProps *>(props.get());
              if (viewProps != nullptr) {
                const_cast<ViewProps *>(viewProps)->transform =
                    Transform::Scale(isScaleX ? 0 : 1, isScaleY ? 0 : 1, 1);
              }
              viewFinal.props = props;
            }

            keyFrame = AnimationKeyFrame{
                better::optional<ShadowViewMutation>(mutation),
                AnimationConfigurationType::Delete,
                tag,
                parent,
                viewStart,
                viewFinal,
                0};
          } else if (mutation.type == ShadowViewMutation::Type::Update) {
            viewFinal = ShadowView(mutation.newChildShadowView);

            keyFrame = AnimationKeyFrame{
                better::optional<ShadowViewMutation>(mutation),
                AnimationConfigurationType::Update,
                tag,
                parent,
                viewStart,
                viewFinal,
                0};
          } else {
            // This should just be "Remove" instructions that are not animated
            // (either this is a "move", or there's a corresponding "Delete"
            // that is animated). We configure it as a Noop animation so it is
            // executed when all the other animations are completed.
            assert(mutation.type == ShadowViewMutation::Type::Remove);

            Tag removeTag = mutation.oldChildShadowView.tag;
            auto correspondingInsertIt = std::find_if(
                mutations.begin(),
                mutations.end(),
                [&removeTag](auto &mutation) {
                  return mutation.type == ShadowViewMutation::Type::Insert &&
                      mutation.newChildShadowView.tag == removeTag;
                });
            if (correspondingInsertIt == mutations.end()) {
              PrintMutationInstruction("Queueing Delayed", mutation);
              keyFrame = AnimationKeyFrame{
                  better::optional<ShadowViewMutation>(mutation),
                  AnimationConfigurationType::Noop,
                  tag,
                  parent,
                  {},
                  {},
                  0};
            } else {
              PrintMutationInstruction(
                  "Executing Remove Immediately, due to reordering operation",
                  mutation);
              immediateMutations.push_back(mutation);
              continue;
            }
          }

          // Handle conflicting animations
          for (auto &conflictingKeyframeTuple : conflictingAnimations) {
            auto &conflictingKeyFrame = std::get<0>(conflictingKeyframeTuple);
            auto const &conflictingMutationBaselineShadowView =
                conflictingKeyFrame.viewStart;

            // We've found a conflict.
            if (conflictingMutationBaselineShadowView.tag == tag) {
              // What's the progress of this ongoing animation?
              double conflictingAnimationProgress =
                  calculateAnimationProgress(
                      now,
                      *std::get<2>(conflictingKeyframeTuple),
                      std::get<1>(conflictingKeyframeTuple))
                      .first;

              // Get a baseline ShadowView at the current progress of the
              // inflight animation. TODO: handle multiple properties being
              // animated separately?
              auto interpolatedInflightShadowView =
                  createInterpolatedShadowView(
                      conflictingAnimationProgress,
                      std::get<1>(conflictingKeyframeTuple),
                      conflictingKeyFrame.viewStart,
                      conflictingKeyFrame.viewEnd);

              // Pick a Prop or layout property, depending on the current
              // animation configuration. Figure out how much progress we've
              // already made in the current animation, and start the animation
              // from this point.
              keyFrame.viewStart = interpolatedInflightShadowView;
              keyFrame.initialProgress = getProgressThroughAnimation(
                  keyFrame, &animation, interpolatedInflightShadowView);

              // We're guaranteed that a tag only has one animation associated
              // with it, so we can break here. If we support multiple
              // animations and animation curves over the same tag in the
              // future, this will need to be modified to support that.
              break;
            }
          }

          keyFramesToAnimate.push_back(keyFrame);
        }

        if (executeMutationImmediately) {
          immediateMutations.push_back(mutation);
        }
      }

#ifdef RN_SHADOW_TREE_INTROSPECTION
      {
        std::stringstream ss(getDebugDescription(immediateMutations, {}));
        std::string to;
        while (std::getline(ss, to, '\n')) {
          LOG(ERROR)
              << "LayoutAnimationKeyFrameManager.cpp: got IMMEDIATE list: Line: "
              << to;
        }
      }

      {
        for (const auto &keyframe : keyFramesToAnimate) {
          if (keyframe.finalMutationForKeyFrame) {
            std::stringstream ss(
                getDebugDescription(*keyframe.finalMutationForKeyFrame, {}));
            std::string to;
            while (std::getline(ss, to, '\n')) {
              LOG(ERROR)
                  << "LayoutAnimationKeyFrameManager.cpp: got FINAL list: Line: "
                  << to;
            }
          }
        }
      }
#endif

      auto finalConflictingMutations = ShadowViewMutationList{};
      for (auto &conflictingKeyframeTuple : conflictingAnimations) {
        auto &keyFrame = std::get<0>(conflictingKeyframeTuple);
        if (keyFrame.finalMutationForKeyFrame.hasValue()) {
          auto &mutation = *keyFrame.finalMutationForKeyFrame;
          finalConflictingMutations.push_back(mutation);
        }
      }

      // Make sure that all operations execute in the proper order, since
      // conflicting animations are not sorted in any reasonable way.
      std::stable_sort(
          finalConflictingMutations.begin(),
          finalConflictingMutations.end(),
          &shouldFirstComeBeforeSecondMutation);

      // Use "final conflicting mutations" to adjust delayed mutations *before*
      // we adjust immediate mutations based on delayed mutations
#ifdef LAYOUT_ANIMATION_VERBOSE_LOGGING
      LOG(ERROR)
          << "Adjust delayed mutations based on finalConflictingMutations";
#endif
      for (auto &mutation : finalConflictingMutations) {
        adjustDelayedMutationIndicesForMutation(surfaceId, mutation);
      }

      // Adjust keyframes based on already-delayed, existing animations, before
      // queueing. We adjust them as if finalConflictingMutations have already
      // been executed - in all cases, finalConflictingMutations will be
      // executed before any of these delayed mutations are.
#ifdef LAYOUT_ANIMATION_VERBOSE_LOGGING
      LOG(ERROR)
          << "Adjust immediate keyFramesToAnimate based on delayed mutations and finalConflictingMutations";
#endif
      for (auto &keyframe : keyFramesToAnimate) {
        if (keyframe.finalMutationForKeyFrame.has_value()) {
          auto &delayedMutation = *keyframe.finalMutationForKeyFrame;
          if (delayedMutation.type == ShadowViewMutation::Type::Remove) {
            adjustImmediateMutationIndicesForDelayedMutations(
                surfaceId, delayedMutation /*, &finalConflictingMutations*/);
          }
        }
      }

      // REMOVE mutations from this animation batch *cannot* be impacted by
      // other REMOVEs from this batch, since they're already taken into
      // account. INSERTs can impact delayed REMOVEs; see below.
#ifdef LAYOUT_ANIMATION_VERBOSE_LOGGING
      LOG(ERROR)
          << "Adjust immediateMutations REMOVEs only, based on previously delayed mutations, without most-recent animation";
#endif
      std::stable_sort(
          immediateMutations.begin(),
          immediateMutations.end(),
          &shouldFirstComeBeforeSecondRemovesOnly);
      for (auto &mutation : immediateMutations) {
        if (mutation.type == ShadowViewMutation::Type::Remove) {
          adjustImmediateMutationIndicesForDelayedMutations(
              surfaceId, mutation);
          adjustDelayedMutationIndicesForMutation(surfaceId, mutation);
        }
      }

      animation.keyFrames = keyFramesToAnimate;
      inflightAnimations_.push_back(std::move(animation));

      // Execute the conflicting, delayed operations immediately. Any UPDATE
      // operations that smoothly transition into another animation will be
      // overridden by generated UPDATE operations at the end of the list, and
      // we want any REMOVE or DELETE operations to execute immediately.
      // Additionally, this should allow us to avoid performing index adjustment
      // between this list of conflicting animations and the batch we're about
      // to execute.
      mutations = ShadowViewMutationList{};
      for (auto &mutation : finalConflictingMutations) {
        mutations.push_back(mutation);
      }

      // Before computing mutations based on animations / final mutations for
      // this frame, we want to update any pending final mutations since they
      // will execute *after* this batch of immediate mutations. Important case
      // to consider (as an example, there are other interesting cases): there's
      // a delayed "Remove", then an immediate "insert" is scheduled for an
      // earlier index with the same parent. The remove needs to be adjusted
      // upward here. Conversely, Inserts at later indices will assume the
      // remove has already been executed, which may not be the case.
#ifdef LAYOUT_ANIMATION_VERBOSE_LOGGING
      LOG(ERROR)
          << "Adjust immediateMutations and delayed mutations, including just-queued animations, based on each one";
#endif
      for (auto &mutation : immediateMutations) {
        if (mutation.type == ShadowViewMutation::Type::Remove) {
          adjustLastAnimationDelayedMutationIndicesForMutation(
              surfaceId, mutation);
        } else if (mutation.type == ShadowViewMutation::Type::Insert) {
          adjustImmediateMutationIndicesForDelayedMutations(
              surfaceId, mutation);
          adjustDelayedMutationIndicesForMutation(surfaceId, mutation);
        }
      }

      // These will be executed immediately. These should already be sorted
      // properly.
      mutations.insert(
          mutations.end(),
          immediateMutations.begin(),
          immediateMutations.end());
    } /* if (currentAnimation) */ else {
      // The ShadowTree layer doesn't realize that certain operations have been
      // delayed, so we must adjust all Remove and Insert operations based on
      // what else has been deferred, whether we are executing this immediately
      // or later.
      for (auto &mutation : mutations) {
        if (mutation.type == ShadowViewMutation::Type::Remove ||
            mutation.type == ShadowViewMutation::Type::Insert) {
          adjustImmediateMutationIndicesForDelayedMutations(
              surfaceId, mutation);
          adjustDelayedMutationIndicesForMutation(surfaceId, mutation);
        }
      }

      // If there's no "next" animation, make sure we queue up "final"
      // operations from all ongoing, conflicting animations.
      ShadowViewMutationList finalMutationsForConflictingAnimations{};
      for (auto &conflictingKeyframeTuple : conflictingAnimations) {
        auto &keyFrame = std::get<0>(conflictingKeyframeTuple);
        if (keyFrame.finalMutationForKeyFrame.hasValue()) {
          finalMutationsForConflictingAnimations.push_back(
              *keyFrame.finalMutationForKeyFrame);
        }
      }

      // Make sure that all operations execute in the proper order.
      // REMOVE operations with highest indices must operate first.
      std::stable_sort(
          finalMutationsForConflictingAnimations.begin(),
          finalMutationsForConflictingAnimations.end(),
          &shouldFirstComeBeforeSecondMutation);

      // Append mutations to this list and swap - so that the final
      // conflicting mutations happen before any other mutations
      finalMutationsForConflictingAnimations.insert(
          finalMutationsForConflictingAnimations.end(),
          mutations.begin(),
          mutations.end());
      mutations = finalMutationsForConflictingAnimations;
    }
  } // if (mutations)

  // We never commit a different root or modify anything -
  // we just send additional mutations to the mounting layer until the
  // animations are finished and the mounting layer (view) represents exactly
  // what is in the most recent shadow tree
  // Add animation mutations to the end of our existing mutations list in this
  // function.
  ShadowViewMutationList mutationsForAnimation{};
  animationMutationsForFrame(surfaceId, mutationsForAnimation, now);

  // Erase any remaining animations that conflict with these mutations
  // In some marginal cases, a DELETE animation can be queued up and a final
  // DELETE mutation be executed by the animation driver. These cases deserve
  // further scrutiny, but for now to prevent crashes, just make sure the queued
  // DELETE operations are removed.
  getAndEraseConflictingAnimations(surfaceId, mutationsForAnimation, true);

  // If any delayed removes were executed, update remaining delayed keyframes
#ifdef LAYOUT_ANIMATION_VERBOSE_LOGGING
  LOG(ERROR)
      << "Adjust all delayed mutations based on final mutations generated by animation driver";
#endif
  for (auto const &mutation : mutationsForAnimation) {
    if (mutation.type == ShadowViewMutation::Type::Remove) {
      adjustDelayedMutationIndicesForMutation(surfaceId, mutation);
    }
  }

  mutations.insert(
      mutations.end(),
      mutationsForAnimation.begin(),
      mutationsForAnimation.end());

  // DEBUG ONLY: list existing inflight animations
#ifdef LAYOUT_ANIMATION_VERBOSE_LOGGING
  LOG(ERROR) << "FINISHING DISPLAYING ONGOING inflightAnimations_!";
  int i = 0;
  int j = 0;
  for (auto &inflightAnimation : inflightAnimations_) {
    i++;
    j = 0;
    if (inflightAnimation.completed) {
      continue;
    }
    for (auto &keyframe : inflightAnimation.keyFrames) {
      j++;
      if (keyframe.invalidated) {
        continue;
      }
      if (keyframe.finalMutationForKeyFrame) {
        std::string msg = "Animation " + std::to_string(i) + " keyframe " +
            std::to_string(j) + ": Final Animation";
        PrintMutationInstruction(msg, *keyframe.finalMutationForKeyFrame);
      } else {
        LOG(ERROR) << "Animation " << i << " keyframe " << j << ": on tag: ["
                   << keyframe.viewStart.tag << "]";
      }
    }
  }
  LOG(ERROR) << "FINISHING DONE DISPLAYING ONGOING inflightAnimations_!";
#endif

  // Signal to delegate if all animations are complete, or if we were not
  // animating anything and now some animation exists.
  if (inflightAnimationsExistInitially && inflightAnimations_.empty()) {
    std::lock_guard<std::mutex> lock(layoutAnimationStatusDelegateMutex_);
    if (layoutAnimationStatusDelegate_ != nullptr) {
      layoutAnimationStatusDelegate_->onAllAnimationsComplete();
    }
  } else if (
      !inflightAnimationsExistInitially && !inflightAnimations_.empty()) {
    std::lock_guard<std::mutex> lock(layoutAnimationStatusDelegateMutex_);
    if (layoutAnimationStatusDelegate_ != nullptr) {
      layoutAnimationStatusDelegate_->onAnimationStarted();
    }
  }

  return MountingTransaction{
      surfaceId, transactionNumber, std::move(mutations), telemetry};
}

bool LayoutAnimationKeyFrameManager::mutatedViewIsVirtual(
    ShadowViewMutation const &mutation) const {
  bool viewIsVirtual = false;

  // TODO: extract this into an Android platform-specific class?
  // Explanation: for "Insert" mutations, oldChildShadowView is always empty.
  //              for "Remove" mutations, newChildShadowView is always empty.
#ifdef ANDROID
  viewIsVirtual =
      mutation.newChildShadowView.layoutMetrics == EmptyLayoutMetrics &&
      mutation.oldChildShadowView.layoutMetrics == EmptyLayoutMetrics;
#endif
  return viewIsVirtual;
}

bool LayoutAnimationKeyFrameManager::hasComponentDescriptorForShadowView(
    ShadowView const &shadowView) const {
  return componentDescriptorRegistry_->hasComponentDescriptorAt(
      shadowView.componentHandle);
}

ComponentDescriptor const &
LayoutAnimationKeyFrameManager::getComponentDescriptorForShadowView(
    ShadowView const &shadowView) const {
  return componentDescriptorRegistry_->at(shadowView.componentHandle);
}

void LayoutAnimationKeyFrameManager::setComponentDescriptorRegistry(
    const SharedComponentDescriptorRegistry &componentDescriptorRegistry) {
  componentDescriptorRegistry_ = componentDescriptorRegistry;
}

/**
 * Given a `progress` between 0 and 1, a mutation and LayoutAnimation config,
 * return a ShadowView with mutated props and/or LayoutMetrics.
 *
 * @param progress
 * @param layoutAnimation
 * @param animatedMutation
 * @return
 */
ShadowView LayoutAnimationKeyFrameManager::createInterpolatedShadowView(
    double progress,
    AnimationConfig const &animationConfig,
    ShadowView startingView,
    ShadowView finalView) const {
  if (!hasComponentDescriptorForShadowView(startingView)) {
    return finalView;
  }
  ComponentDescriptor const &componentDescriptor =
      getComponentDescriptorForShadowView(startingView);
  auto mutatedShadowView = ShadowView(startingView);

  if (startingView.props == nullptr || finalView.props == nullptr) {
    return finalView;
  }

  // Animate opacity or scale/transform
  mutatedShadowView.props = componentDescriptor.interpolateProps(
      progress, startingView.props, finalView.props);

  // Interpolate LayoutMetrics
  LayoutMetrics const &finalLayoutMetrics = finalView.layoutMetrics;
  LayoutMetrics const &baselineLayoutMetrics = startingView.layoutMetrics;
  LayoutMetrics interpolatedLayoutMetrics = finalLayoutMetrics;
  interpolatedLayoutMetrics.frame.origin.x = interpolateFloats(
      progress,
      baselineLayoutMetrics.frame.origin.x,
      finalLayoutMetrics.frame.origin.x);
  interpolatedLayoutMetrics.frame.origin.y = interpolateFloats(
      progress,
      baselineLayoutMetrics.frame.origin.y,
      finalLayoutMetrics.frame.origin.y);
  interpolatedLayoutMetrics.frame.size.width = interpolateFloats(
      progress,
      baselineLayoutMetrics.frame.size.width,
      finalLayoutMetrics.frame.size.width);
  interpolatedLayoutMetrics.frame.size.height = interpolateFloats(
      progress,
      baselineLayoutMetrics.frame.size.height,
      finalLayoutMetrics.frame.size.height);
  mutatedShadowView.layoutMetrics = interpolatedLayoutMetrics;

  return mutatedShadowView;
}

void LayoutAnimationKeyFrameManager::callCallback(
    const LayoutAnimationCallbackWrapper &callback) const {
  if (callback.readyForCleanup()) {
    return;
  }

  // Callbacks can only be called once. Replace the callsite with an empty
  // CallbackWrapper. We use a unique_ptr to avoid copying into the vector.
  std::unique_ptr<LayoutAnimationCallbackWrapper> copiedCallback(
      std::make_unique<LayoutAnimationCallbackWrapper>(callback));

  // Call the callback that is being retained in the vector
  copiedCallback->call(runtimeExecutor_);

  // Protect with a mutex: this can be called on failure callbacks in the JS
  // thread and success callbacks on the UI thread
  {
    std::lock_guard<std::mutex> lock(callbackWrappersPendingMutex_);

    // Clean any stale data in the retention vector
    callbackWrappersPending_.erase(
        std::remove_if(
            callbackWrappersPending_.begin(),
            callbackWrappersPending_.end(),
            [](const std::unique_ptr<LayoutAnimationCallbackWrapper> &wrapper) {
              return wrapper->readyForCleanup();
            }),
        callbackWrappersPending_.end());

    // Hold onto a reference to the callback, only while
    // LayoutAnimationKeyFrameManager is alive and the callback hasn't completed
    // yet.
    callbackWrappersPending_.push_back(std::move(copiedCallback));
  }
}

} // namespace react
} // namespace facebook
