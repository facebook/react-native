/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LayoutAnimationKeyFrameManager.h"

#include <algorithm>
#include <chrono>

#include <react/componentregistry/ComponentDescriptorFactory.h>
#include <react/components/root/RootShadowNode.h>
#include <react/components/view/ViewProps.h>
#include <react/core/ComponentDescriptor.h>
#include <react/core/LayoutMetrics.h>
#include <react/core/LayoutableShadowNode.h>
#include <react/core/Props.h>
#include <react/core/RawValue.h>
#include <react/mounting/MountingCoordinator.h>

#include <react/mounting/Differentiator.h>
#include <react/mounting/ShadowTreeRevision.h>
#include <react/mounting/ShadowView.h>
#include <react/mounting/ShadowViewMutation.h>

#include <Glog/logging.h>

namespace facebook {
namespace react {

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
 */
void LayoutAnimationKeyFrameManager::uiManagerDidConfigureNextLayoutAnimation(
    RawValue const &config,
    std::shared_ptr<const EventTarget> successCallback,
    std::shared_ptr<const EventTarget> errorCallback) const {
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
                        errorCallback,
                        {}}};
  } else {
    // TODO: call errorCallback
    LOG(ERROR) << "Parsing LayoutAnimationConfig failed: "
               << (folly::dynamic)config;
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

void LayoutAnimationKeyFrameManager::adjustDelayedMutationIndicesForMutation(
    SurfaceId surfaceId,
    ShadowViewMutation const &mutation) const {
  bool isRemoveMutation = mutation.type == ShadowViewMutation::Type::Remove;
  bool isInsertMutation = mutation.type == ShadowViewMutation::Type::Insert;
  assert(isRemoveMutation || isInsertMutation);

  if (mutatedViewIsVirtual(mutation)) {
    return;
  }

  for (auto &inflightAnimation : inflightAnimations_) {
    if (inflightAnimation.surfaceId != surfaceId) {
      continue;
    }

    for (auto it = inflightAnimation.keyFrames.begin();
         it != inflightAnimation.keyFrames.end();
         it++) {
      auto &animatedKeyFrame = *it;

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

      if (finalAnimationMutation.type != ShadowViewMutation::Type::Remove) {
        continue;
      }

      // Do we need to adjust the index of this operation?
      if (isRemoveMutation) {
        if (mutation.index <= finalAnimationMutation.index) {
          finalAnimationMutation.index--;
        }
      } else if (isInsertMutation) {
        if (mutation.index <= finalAnimationMutation.index) {
          finalAnimationMutation.index++;
        }
      }
    }
  }
}

better::optional<MountingTransaction>
LayoutAnimationKeyFrameManager::pullTransaction(
    SurfaceId surfaceId,
    MountingTransaction::Number transactionNumber,
    MountingTelemetry const &telemetry,
    ShadowViewMutationList mutations) const {
  // Current time in milliseconds
  uint64_t now =
      std::chrono::duration_cast<std::chrono::milliseconds>(
          std::chrono::high_resolution_clock::now().time_since_epoch())
          .count();

  bool inflightAnimationsExistInitially = !inflightAnimations_.empty();

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
        conflictingAnimations{};
    for (auto &mutation : mutations) {
      auto const &baselineShadowView =
          (mutation.type == ShadowViewMutation::Type::Insert)
          ? mutation.newChildShadowView
          : mutation.oldChildShadowView;

      for (auto &inflightAnimation : inflightAnimations_) {
        if (inflightAnimation.surfaceId != surfaceId) {
          continue;
        }

        for (auto it = inflightAnimation.keyFrames.begin();
             it != inflightAnimation.keyFrames.end();) {
          auto &animatedKeyFrame = *it;

          // Conflicting animation detected
          if (animatedKeyFrame.tag == baselineShadowView.tag) {
            auto const layoutAnimationConfig =
                inflightAnimation.layoutAnimationConfig;

            auto const mutationConfig =
                (animatedKeyFrame.type == AnimationConfigurationType::Delete
                     ? layoutAnimationConfig.deleteConfig
                     : (animatedKeyFrame.type ==
                                AnimationConfigurationType::Create
                            ? layoutAnimationConfig.createConfig
                            : layoutAnimationConfig.updateConfig));

            conflictingAnimations.push_back(std::make_tuple(
                animatedKeyFrame, *mutationConfig, &inflightAnimation));

            // Delete from existing animation
            it = inflightAnimation.keyFrames.erase(it);
          } else {
            it++;
          }
        }
      }
    }

    // Are we animating this list of mutations?
    better::optional<LayoutAnimation> currentAnimation{};
    {
      std::lock_guard<std::mutex> lock(currentAnimationMutex_);
      if (currentAnimation_) {
        currentAnimation = currentAnimation_;
        currentAnimation_ = {};
      }
    }

    if (currentAnimation) {
      LayoutAnimation animation = currentAnimation.value();
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
        auto const &componentDescriptor =
            getComponentDescriptorForShadowView(baselineShadowView);

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
          // Indices for immediate INSERT mutations must be adjusted to insert
          // at higher indices if previous animations have deferred removals
          // before the insertion indect
          // TODO: refactor to reduce code duplication
          if (mutation.type == ShadowViewMutation::Type::Insert) {
            int adjustedIndex = mutation.index;
            for (const auto &inflightAnimation : inflightAnimations_) {
              if (inflightAnimation.surfaceId != surfaceId) {
                continue;
              }
              for (auto it = inflightAnimation.keyFrames.begin();
                   it != inflightAnimation.keyFrames.end();
                   it++) {
                const auto &animatedKeyFrame = *it;
                if (!animatedKeyFrame.finalMutationForKeyFrame.has_value() ||
                    animatedKeyFrame.parentView.tag !=
                        mutation.parentShadowView.tag ||
                    animatedKeyFrame.type != AnimationConfigurationType::Noop) {
                  continue;
                }
                const auto &delayedFinalMutation =
                    *animatedKeyFrame.finalMutationForKeyFrame;
                if (delayedFinalMutation.type ==
                        ShadowViewMutation::Type::Remove &&
                    delayedFinalMutation.index <= adjustedIndex) {
                  adjustedIndex++;
                }
              }
            }
            mutation.index = adjustedIndex;
          }

          immediateMutations.push_back(mutation);

          // Adjust indices for any non-directly-conflicting animations that
          // affect the same parent view by inserting or removing anything
          // from the hierarchy.
          if (mutation.type == ShadowViewMutation::Type::Insert ||
              mutation.type == ShadowViewMutation::Type::Remove) {
            adjustDelayedMutationIndicesForMutation(surfaceId, mutation);
          }
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
          Tag parentTag = mutation.parentShadowView.tag;

          AnimationKeyFrame keyFrame{};
          if (mutation.type == ShadowViewMutation::Type::Insert) {
            if (mutationConfig->animationProperty ==
                AnimationProperty::Opacity) {
              auto props = componentDescriptor.cloneProps(viewStart.props, {});
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
            if (isScaleX || isScaleY) {
              auto props = componentDescriptor.cloneProps(viewStart.props, {});
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
                AnimationProperty::Opacity) {
              auto props = componentDescriptor.cloneProps(viewFinal.props, {});
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
            if (isScaleX || isScaleY) {
              auto props = componentDescriptor.cloneProps(viewFinal.props, {});
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

            // For remove instructions: since the execution of the Remove
            // instruction will be delayed and therefore may execute outside of
            // otherwise-expected order, other views may be inserted before the
            // Remove is executed, requiring index adjustment.
            // To be clear: when executed synchronously, REMOVE operations
            // always come before INSERT operations (at the same level of the
            // tree hierarchy).
            {
              int adjustedIndex = mutation.index;
              for (auto &otherMutation : mutations) {
                if (otherMutation.type == ShadowViewMutation::Type::Insert &&
                    otherMutation.parentShadowView.tag == parentTag) {
                  if (otherMutation.index <= adjustedIndex &&
                      !mutatedViewIsVirtual(otherMutation)) {
                    adjustedIndex++;
                  } else {
                    // If we are delaying this remove instruction, conversely,
                    // we must adjust upward the insertion index of any INSERT
                    // instructions if the View is insert *after* this view in
                    // the hierarchy.
                    otherMutation.index++;
                  }
                }
              }

              // We also need to account for delayed mutations that have already
              // been queued, such that their ShadowNodes are not accounted for
              // in mutation instructions, but they are still in the platform's
              // View hierarchy.
              for (const auto &inflightAnimation : inflightAnimations_) {
                if (inflightAnimation.surfaceId != surfaceId) {
                  continue;
                }
                for (auto it = inflightAnimation.keyFrames.begin();
                     it != inflightAnimation.keyFrames.end();
                     it++) {
                  const auto &animatedKeyFrame = *it;
                  if (!animatedKeyFrame.finalMutationForKeyFrame.has_value() ||
                      animatedKeyFrame.parentView.tag != parentTag ||
                      animatedKeyFrame.type !=
                          AnimationConfigurationType::Noop) {
                    continue;
                  }
                  const auto &delayedFinalMutation =
                      *animatedKeyFrame.finalMutationForKeyFrame;
                  if (delayedFinalMutation.type ==
                          ShadowViewMutation::Type::Remove &&
                      delayedFinalMutation.index <= adjustedIndex) {
                    adjustedIndex++;
                  }
                }
              }

              mutation = ShadowViewMutation::RemoveMutation(
                  mutation.parentShadowView,
                  mutation.oldChildShadowView,
                  adjustedIndex);
            }

            keyFrame = AnimationKeyFrame{
                better::optional<ShadowViewMutation>(mutation),
                AnimationConfigurationType::Noop,
                tag,
                parent,
                {},
                {},
                0};
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

      animation.keyFrames = keyFramesToAnimate;
      inflightAnimations_.push_back(animation);

      // These will be executed immediately.
      mutations = immediateMutations;
    } /* if (currentAnimation) */ else {
      // If there's no "next" animation, make sure we queue up "final"
      // operations from all ongoing animations.
      ShadowViewMutationList finalMutationsForConflictingAnimations{};
      for (auto &conflictingKeyframeTuple : conflictingAnimations) {
        auto &keyFrame = std::get<0>(conflictingKeyframeTuple);
        if (keyFrame.finalMutationForKeyFrame.hasValue()) {
          finalMutationsForConflictingAnimations.push_back(
              *keyFrame.finalMutationForKeyFrame);
        }
      }

      // Append mutations to this list and swap - so that the final
      // conflicting mutations happen before any other mutations
      finalMutationsForConflictingAnimations.insert(
          finalMutationsForConflictingAnimations.end(),
          mutations.begin(),
          mutations.end());
      mutations = finalMutationsForConflictingAnimations;

      // Adjust pending mutation indices base on these operations
      for (auto &mutation : mutations) {
        if (mutation.type == ShadowViewMutation::Type::Insert ||
            mutation.type == ShadowViewMutation::Type::Remove) {
          adjustDelayedMutationIndicesForMutation(surfaceId, mutation);
        }
      }
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

  // Adjust pending mutation indices base on these operations
  // For example: if a final "remove" mutation has been performed, and there is
  // another that has not yet been executed because it is a part of an ongoing
  // animation, its index may need to be adjusted.
  for (auto const &animatedMutation : mutationsForAnimation) {
    if (animatedMutation.type == ShadowViewMutation::Type::Remove) {
      adjustDelayedMutationIndicesForMutation(surfaceId, animatedMutation);
    }
  }

  mutations.insert(
      mutations.end(),
      mutationsForAnimation.begin(),
      mutationsForAnimation.end());

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

  // TODO: extract this into an Android platform-specific class
  // Explanation: for "Insert" mutations, oldChildShadowView is always empty.
  //              for "Remove" mutations, newChildShadowView is always empty.
#ifdef ANDROID
  viewIsVirtual =
      mutation.newChildShadowView.layoutMetrics == EmptyLayoutMetrics &&
      mutation.oldChildShadowView.layoutMetrics == EmptyLayoutMetrics;
#endif

  return viewIsVirtual;
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
  ComponentDescriptor const &componentDescriptor =
      getComponentDescriptorForShadowView(startingView);
  auto mutatedShadowView = ShadowView(startingView);

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

} // namespace react
} // namespace facebook
