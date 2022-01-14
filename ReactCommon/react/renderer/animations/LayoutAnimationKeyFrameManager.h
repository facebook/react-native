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
#include <react/renderer/debug/flags.h>
#include <react/renderer/mounting/Differentiator.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/MountingOverrideDelegate.h>
#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/uimanager/LayoutAnimationStatusDelegate.h>
#include <react/renderer/uimanager/UIManagerAnimationDelegate.h>

namespace facebook {
namespace react {

#ifdef LAYOUT_ANIMATION_VERBOSE_LOGGING
void PrintMutationInstruction(
    std::string message,
    ShadowViewMutation const &mutation);
void PrintMutationInstructionRelative(
    std::string message,
    ShadowViewMutation const &mutation,
    ShadowViewMutation const &relativeMutation);
#else
#define PrintMutationInstruction(a, b)
#define PrintMutationInstructionRelative(a, b, c)
#endif

// This corresponds exactly with JS.
enum class AnimationType {
  None = 0,
  Spring = 1,
  Linear = 2,
  EaseInEaseOut = 4,
  EaseIn = 8,
  EaseOut = 16,
  Keyboard = 32
};
enum class AnimationProperty {
  NotApplicable = 0,
  Opacity = 1,
  ScaleX = 2,
  ScaleY = 4,
  ScaleXY = 8
};
enum class AnimationConfigurationType { Create = 1, Update = 2, Delete = 4 };

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
  AnimationConfig createConfig;
  AnimationConfig updateConfig;
  AnimationConfig deleteConfig;
};

struct AnimationKeyFrame {
  // The mutation(s) that should be executed once the animation completes.
  // This maybe empty.
  // For CREATE/INSERT this will contain CREATE, INSERT in that order.
  // For REMOVE/DELETE, same.
  std::vector<ShadowViewMutation> finalMutationsForKeyFrame;

  // The type of animation this is (for configuration purposes)
  AnimationConfigurationType type;

  // Tag representing the node being animated.
  Tag tag;

  ShadowView parentView;

  // ShadowView representing the start and end points of this animation.
  ShadowView viewStart;
  ShadowView viewEnd;

  // ShadowView representing the previous frame of the animation.
  ShadowView viewPrev;

  // If an animation interrupts an existing one, the starting state may actually
  // be halfway through the intended transition.
  double initialProgress;

  bool invalidated{false};

  // In the case where some mutation conflicts with this keyframe,
  // should we generate final synthetic UPDATE mutations for this keyframe?
  bool generateFinalSyntheticMutations{true};
};

class LayoutAnimationCallbackWrapper {
 public:
  LayoutAnimationCallbackWrapper(jsi::Function &&callback)
      : callback_(std::make_shared<jsi::Function>(std::move(callback))) {}
  LayoutAnimationCallbackWrapper() : callback_(nullptr) {}

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
    std::shared_ptr<std::atomic_bool> callComplete = callComplete_;

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
  std::shared_ptr<std::atomic_bool> callComplete_ =
      std::make_shared<std::atomic_bool>(false);
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
        layoutAnimationStatusDelegate_(delegate),
        now_([]() {
          return std::chrono::duration_cast<std::chrono::milliseconds>(
                     std::chrono::high_resolution_clock::now()
                         .time_since_epoch())
              .count();
        }) {}
  ~LayoutAnimationKeyFrameManager() {}

#pragma mark UIManagerAnimationDelegate methods

  void uiManagerDidConfigureNextLayoutAnimation(
      jsi::Runtime &runtime,
      RawValue const &config,
      const jsi::Value &successCallbackValue,
      const jsi::Value &failureCallbackValue) const override;

  void setComponentDescriptorRegistry(SharedComponentDescriptorRegistry const &
                                          componentDescriptorRegistry) override;

  // TODO: add SurfaceId to this API as well
  bool shouldAnimateFrame() const override;

  void stopSurface(SurfaceId surfaceId) override;

#pragma mark MountingOverrideDelegate methods

  bool shouldOverridePullTransaction() const override;

  // This is used to "hijack" the diffing process to figure out which mutations
  // should be animated. The mutations returned by this function will be
  // executed immediately.
  better::optional<MountingTransaction> pullTransaction(
      SurfaceId surfaceId,
      MountingTransaction::Number number,
      TransactionTelemetry const &telemetry,
      ShadowViewMutationList mutations) const override;

  // Exposed for testing.
 public:
  void uiManagerDidConfigureNextLayoutAnimation(
      LayoutAnimation layoutAnimation) const;

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

  // Function that returns current time in milliseconds
  std::function<uint64_t()> now_;

  void adjustImmediateMutationIndicesForDelayedMutations(
      SurfaceId surfaceId,
      ShadowViewMutation &mutation,
      bool skipLastAnimation = false,
      bool lastAnimationOnly = false) const;

  void adjustDelayedMutationIndicesForMutation(
      SurfaceId surfaceId,
      ShadowViewMutation const &mutation,
      bool skipLastAnimation = false) const;

  void getAndEraseConflictingAnimations(
      SurfaceId surfaceId,
      ShadowViewMutationList const &mutations,
      std::vector<AnimationKeyFrame> &conflictingAnimations) const;

  mutable std::mutex surfaceIdsToStopMutex_;
  mutable std::vector<SurfaceId> surfaceIdsToStop_{};

 protected:
  bool hasComponentDescriptorForShadowView(ShadowView const &shadowView) const;
  ComponentDescriptor const &getComponentDescriptorForShadowView(
      ShadowView const &shadowView) const;
  std::pair<double, double> calculateAnimationProgress(
      uint64_t now,
      LayoutAnimation const &animation,
      AnimationConfig const &mutationConfig) const;

  ShadowView createInterpolatedShadowView(
      double progress,
      ShadowView startingView,
      ShadowView finalView) const;

  void callCallback(const LayoutAnimationCallbackWrapper &callback) const;

  virtual void animationMutationsForFrame(
      SurfaceId surfaceId,
      ShadowViewMutation::List &mutationsList,
      uint64_t now) const = 0;

  /**
   * Queue (and potentially synthesize) final mutations for a finished keyframe.
   * Keyframe animation may have timed-out, or be canceled due to a conflict.
   */
  void queueFinalMutationsForCompletedKeyFrame(
      AnimationKeyFrame const &keyframe,
      ShadowViewMutation::List &mutationsList,
      bool interrupted,
      std::string logPrefix) const;

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

 public:
  void setClockNow(std::function<uint64_t()> now);
};

static inline bool shouldFirstComeBeforeSecondRemovesOnly(
    ShadowViewMutation const &lhs,
    ShadowViewMutation const &rhs) noexcept {
  // Make sure that removes on the same level are sorted - highest indices must
  // come first.
  return (lhs.type == ShadowViewMutation::Type::Remove &&
          lhs.type == rhs.type) &&
      (lhs.parentShadowView.tag == rhs.parentShadowView.tag) &&
      (lhs.index > rhs.index);
}

static inline bool shouldFirstComeBeforeSecondMutation(
    ShadowViewMutation const &lhs,
    ShadowViewMutation const &rhs) noexcept {
  if (lhs.type != rhs.type) {
    // Deletes always come last
    if (lhs.type == ShadowViewMutation::Type::Delete) {
      return false;
    }
    if (rhs.type == ShadowViewMutation::Type::Delete) {
      return true;
    }

    // Remove comes before insert
    if (lhs.type == ShadowViewMutation::Type::Remove &&
        rhs.type == ShadowViewMutation::Type::Insert) {
      return true;
    }
    if (rhs.type == ShadowViewMutation::Type::Remove &&
        lhs.type == ShadowViewMutation::Type::Insert) {
      return false;
    }

    // Create comes before insert
    if (lhs.type == ShadowViewMutation::Type::Create &&
        rhs.type == ShadowViewMutation::Type::Insert) {
      return true;
    }
    if (rhs.type == ShadowViewMutation::Type::Create &&
        lhs.type == ShadowViewMutation::Type::Insert) {
      return false;
    }
  } else {
    // Make sure that removes on the same level are sorted - highest indices
    // must come first.
    if (lhs.type == ShadowViewMutation::Type::Remove &&
        lhs.parentShadowView.tag == rhs.parentShadowView.tag) {
      if (lhs.index > rhs.index) {
        return true;
      } else {
        return false;
      }
    }
  }

  return false;
}

} // namespace react
} // namespace facebook
