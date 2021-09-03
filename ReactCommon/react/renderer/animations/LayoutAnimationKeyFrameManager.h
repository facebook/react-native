/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <better/optional.h>
#include <react/renderer/core/EventTarget.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/mounting/Differentiator.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/MountingOverrideDelegate.h>
#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/uimanager/LayoutAnimationStatusDelegate.h>
#include <react/renderer/uimanager/UIManagerAnimationDelegate.h>

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

class LayoutAnimationCallbackWrapper {
 public:
  LayoutAnimationCallbackWrapper(jsi::Function &&callback)
      : callback_(std::make_shared<jsi::Function>(std::move(callback))) {}
  LayoutAnimationCallbackWrapper() : callback_(nullptr) {}
  ~LayoutAnimationCallbackWrapper() {}

  // Copy and assignment-copy constructors should copy callback_, and not
  // std::move it. Copying is desirable, otherwise the shared_ptr and
  // jsi::Function will be deallocated too early.

  bool readyForCleanup() const {
    return callback_ == nullptr || *callComplete_;
  }

  void call(const RuntimeExecutor &runtimeExecutor) const {
    if (readyForCleanup()) {
      return;
    }

    std::weak_ptr<jsi::Function> callable = callback_;
    std::shared_ptr<bool> callComplete = callComplete_;

    runtimeExecutor(
        [=, callComplete = std::move(callComplete)](jsi::Runtime &runtime) {
          auto fn = callable.lock();

          if (!fn || *callComplete) {
            return;
          }

          fn->call(runtime);
          *callComplete = true;
        });
  }

 private:
  std::shared_ptr<bool> callComplete_ = std::make_shared<bool>(false);
  std::shared_ptr<jsi::Function> callback_;
};

struct LayoutAnimation {
  SurfaceId surfaceId;
  uint64_t startTime;
  bool completed = false;
  LayoutAnimationConfig layoutAnimationConfig;
  LayoutAnimationCallbackWrapper successCallback;
  LayoutAnimationCallbackWrapper failureCallback;
  std::vector<AnimationKeyFrame> keyFrames;
};

class LayoutAnimationKeyFrameManager : public UIManagerAnimationDelegate,
                                       public MountingOverrideDelegate {
 public:
  LayoutAnimationKeyFrameManager(
      RuntimeExecutor runtimeExecutor,
      LayoutAnimationStatusDelegate *delegate)
      : runtimeExecutor_(runtimeExecutor),
        layoutAnimationStatusDelegate_(delegate) {}
  ~LayoutAnimationKeyFrameManager() {}

  void uiManagerDidConfigureNextLayoutAnimation(
      jsi::Runtime &runtime,
      RawValue const &config,
      const jsi::Value &successCallbackValue,
      const jsi::Value &failureCallbackValue) const override;
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
  RuntimeExecutor runtimeExecutor_;
  mutable std::mutex layoutAnimationStatusDelegateMutex_;
  mutable LayoutAnimationStatusDelegate *layoutAnimationStatusDelegate_{};

  void adjustDelayedMutationIndicesForMutation(
      SurfaceId surfaceId,
      ShadowViewMutation const &mutation) const;

 protected:
  bool mutatedViewIsVirtual(ShadowViewMutation const &mutation) const;

  bool hasComponentDescriptorForShadowView(ShadowView const &shadowView) const;
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

  void callCallback(const LayoutAnimationCallbackWrapper &callback) const;

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

 private:
  // A vector of callable function wrappers that are in the process of being
  // called
  mutable std::mutex callbackWrappersPendingMutex_;
  mutable std::vector<std::unique_ptr<LayoutAnimationCallbackWrapper>>
      callbackWrappersPending_{};
};

} // namespace react
} // namespace facebook
