/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/EventTarget.h>
#include <react/core/RawValue.h>
#include <react/mounting/Differentiator.h>
#include <react/mounting/MountingCoordinator.h>
#include <react/mounting/MountingOverrideDelegate.h>
#include <react/mounting/MountingTransaction.h>
#include <react/mounting/ShadowViewMutation.h>
#include <react/uimanager/LayoutAnimationStatusDelegate.h>
#include <react/uimanager/UIManagerAnimationDelegate.h>

namespace facebook {
namespace react {

// This corresponds exactly with JS.
enum class AnimationType {
  None,
  Spring,
  Linear,
  EaseInEaseOut,
  EaseIn,
  EaseOut,
  Keyboard
};
enum class AnimationProperty {
  NotApplicable,
  Opacity,
  ScaleX,
  ScaleY,
  ScaleXY
};
enum class AnimationConfigurationType {
  Noop, // for animation placeholders that are not animated, and should be
  // executed once other animations have completed
  Create,
  Update,
  Delete
};

// This corresponds exactly with JS.
struct AnimationConfig {
  AnimationType animationType = AnimationType::None;
  AnimationProperty animationProperty = AnimationProperty::NotApplicable;
  double duration =
      0; // these are perhaps better represented as uint64_t, but they
  // come from JS as doubles
  double delay = 0;
  double springDamping = 0;
  double initialVelocity = 0;
};

// This corresponds exactly with JS.
struct LayoutAnimationConfig {
  double duration; // ms
  better::optional<AnimationConfig> createConfig;
  better::optional<AnimationConfig> updateConfig;
  better::optional<AnimationConfig> deleteConfig;
};

struct AnimationKeyFrame {
  // The mutation that should be executed once the animation completes
  // (optional).
  better::optional<ShadowViewMutation> finalMutationForKeyFrame;

  // The type of animation this is (for configuration purposes)
  AnimationConfigurationType type;

  // Tag representing the node being animated.
  Tag tag;

  ShadowView parentView;

  // ShadowView representing the start and end points of this animation.
  ShadowView viewStart;
  ShadowView viewEnd;

  // If an animation interrupts an existing one, the starting state may actually
  // be halfway through the intended transition.
  double initialProgress;
};

struct LayoutAnimation {
  SurfaceId surfaceId;
  uint64_t startTime;
  bool completed = false;
  LayoutAnimationConfig layoutAnimationConfig;
  std::shared_ptr<const EventTarget> successCallback;
  std::shared_ptr<const EventTarget> errorCallback;
  std::vector<AnimationKeyFrame> keyFrames;
};

class LayoutAnimationKeyFrameManager : public UIManagerAnimationDelegate,
                                       public MountingOverrideDelegate {
 public:
  LayoutAnimationKeyFrameManager(LayoutAnimationStatusDelegate *delegate)
      : layoutAnimationStatusDelegate_(delegate) {
    // This is the ONLY place where we set or access
    // layoutAnimationStatusDelegate_ without a mutex.
  }
  ~LayoutAnimationKeyFrameManager() {}

  void uiManagerDidConfigureNextLayoutAnimation(
      RawValue const &config,
      std::shared_ptr<EventTarget const> successCallback,
      std::shared_ptr<EventTarget const> errorCallback) const override;
  void setComponentDescriptorRegistry(SharedComponentDescriptorRegistry const &
                                          componentDescriptorRegistry) override;

  // TODO: add SurfaceId to this API as well
  bool shouldAnimateFrame() const override;

  bool shouldOverridePullTransaction() const override;

  // This is used to "hijack" the diffing process to figure out which mutations
  // should be animated. The mutations returned by this function will be
  // executed immediately.
  better::optional<MountingTransaction> pullTransaction(
      SurfaceId surfaceId,
      MountingTransaction::Number number,
      MountingTelemetry const &telemetry,
      ShadowViewMutationList mutations) const override;

  // LayoutAnimationStatusDelegate - this is for the platform to get
  // signal when animations start and complete. Setting and resetting this
  // delegate is protected by a mutex; ALL method calls into this delegate are
  // also protected by the mutex! The only way to set this without a mutex is
  // via a constructor.
 public:
  void setLayoutAnimationStatusDelegate(
      LayoutAnimationStatusDelegate *delegate) const;

 private:
  mutable std::mutex layoutAnimationStatusDelegateMutex_;
  mutable LayoutAnimationStatusDelegate *layoutAnimationStatusDelegate_{};

  void adjustDelayedMutationIndicesForMutation(
      SurfaceId surfaceId,
      ShadowViewMutation const &mutation) const;

 protected:
  bool mutatedViewIsVirtual(ShadowViewMutation const &mutation) const;

  ComponentDescriptor const &getComponentDescriptorForShadowView(
      ShadowView const &shadowView) const;
  std::pair<double, double> calculateAnimationProgress(
      uint64_t now,
      LayoutAnimation const &animation,
      AnimationConfig const &mutationConfig) const;

  ShadowView createInterpolatedShadowView(
      double progress,
      AnimationConfig const &animationConfig,
      ShadowView startingView,
      ShadowView finalView) const;

  virtual void animationMutationsForFrame(
      SurfaceId surfaceId,
      ShadowViewMutation::List &mutationsList,
      uint64_t now) const = 0;

  virtual double getProgressThroughAnimation(
      AnimationKeyFrame const &keyFrame,
      LayoutAnimation const *layoutAnimation,
      ShadowView const &animationStateView) const = 0;

  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  mutable better::optional<LayoutAnimation> currentAnimation_{};
  mutable std::mutex currentAnimationMutex_;

  /**
   * All mutations of inflightAnimations_ are thread-safe as long as
   * we keep the contract of: only mutate it within the context of
   * `pullTransaction`. If that contract is held, this is implicitly protected
   * by the MountingCoordinator's mutex.
   */
  mutable std::vector<LayoutAnimation> inflightAnimations_{};
};

} // namespace react
} // namespace facebook
