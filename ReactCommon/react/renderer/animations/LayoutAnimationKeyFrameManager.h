/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <butter/set.h>
#include <react/renderer/animations/LayoutAnimationCallbackWrapper.h>
#include <react/renderer/animations/primitives.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/debug/flags.h>
#include <react/renderer/mounting/MountingOverrideDelegate.h>
#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/uimanager/LayoutAnimationStatusDelegate.h>
#include <react/renderer/uimanager/UIManagerAnimationDelegate.h>

#include <optional>

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

class LayoutAnimationKeyFrameManager : public UIManagerAnimationDelegate,
                                       public MountingOverrideDelegate {
 public:
  LayoutAnimationKeyFrameManager(
      RuntimeExecutor runtimeExecutor,
      ContextContainer::Shared &contextContainer,
      LayoutAnimationStatusDelegate *delegate);

#pragma mark - UIManagerAnimationDelegate methods

  void uiManagerDidConfigureNextLayoutAnimation(
      jsi::Runtime &runtime,
      RawValue const &config,
      const jsi::Value &successCallbackValue,
      const jsi::Value &failureCallbackValue) const override;

  void setComponentDescriptorRegistry(SharedComponentDescriptorRegistry const &
                                          componentDescriptorRegistry) override;

  void setReduceDeleteCreateMutation(bool reduceDeleteCreateMutation) override;

  // TODO: add SurfaceId to this API as well
  bool shouldAnimateFrame() const override;

  void stopSurface(SurfaceId surfaceId) override;

#pragma mark - MountingOverrideDelegate methods

  bool shouldOverridePullTransaction() const override;

  // This is used to "hijack" the diffing process to figure out which mutations
  // should be animated. The mutations returned by this function will be
  // executed immediately.
  std::optional<MountingTransaction> pullTransaction(
      SurfaceId surfaceId,
      MountingTransaction::Number number,
      TransactionTelemetry const &telemetry,
      ShadowViewMutationList mutations) const override;

  // Exposed for testing.
  void uiManagerDidConfigureNextLayoutAnimation(
      LayoutAnimation layoutAnimation) const;

  // LayoutAnimationStatusDelegate - this is for the platform to get
  // signal when animations start and complete. Setting and resetting this
  // delegate is protected by a mutex; ALL method calls into this delegate are
  // also protected by the mutex! The only way to set this without a mutex is
  // via a constructor.
  void setLayoutAnimationStatusDelegate(
      LayoutAnimationStatusDelegate *delegate) const;

  void setClockNow(std::function<uint64_t()> now);

  void enableSkipInvalidatedKeyFrames();

  void enableCrashOnMissingComponentDescriptor();

  void enableSimulateImagePropsMemoryAccess();

 protected:
  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  mutable std::optional<LayoutAnimation> currentAnimation_{};
  mutable std::mutex currentAnimationMutex_;

  /**
   * All mutations of inflightAnimations_ are thread-safe as long as
   * we keep the contract of: only mutate it within the context of
   * `pullTransaction`. If that contract is held, this is implicitly protected
   * by the MountingCoordinator's mutex.
   */
  mutable std::vector<LayoutAnimation> inflightAnimations_{};

  bool hasComponentDescriptorForShadowView(ShadowView const &shadowView) const;
  ComponentDescriptor const &getComponentDescriptorForShadowView(
      ShadowView const &shadowView) const;

  /**
   * Given a `progress` between 0 and 1, a mutation and LayoutAnimation config,
   * return a ShadowView with mutated props and/or LayoutMetrics.
   *
   * @param progress
   * @param layoutAnimation
   * @param animatedMutation
   * @return
   */
  ShadowView createInterpolatedShadowView(
      Float progress,
      ShadowView const &startingView,
      ShadowView const &finalView) const;

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
      const std::string &logPrefix) const;

 private:
  RuntimeExecutor runtimeExecutor_;
  ContextContainer::Shared contextContainer_;

  mutable std::mutex layoutAnimationStatusDelegateMutex_;
  mutable LayoutAnimationStatusDelegate *layoutAnimationStatusDelegate_{};
  mutable std::mutex surfaceIdsToStopMutex_;
  mutable butter::set<SurfaceId> surfaceIdsToStop_{};
  bool skipInvalidatedKeyFrames_{false};
  bool reduceDeleteCreateMutation_{false};

  /*
   * Feature flag that forces a crash if component descriptor for shadow view
   * doesn't exist. This is an unexpected state and we crash to collect extra
   * logs.
   */
  bool crashOnMissingComponentDescriptor_{false};

  /*
   * Feature flag that enables simulation of memory access. This is a temporary
   * flag to diagnose where crashes are coming from in LayoutAnimations on iOS.
   */
  bool simulateImagePropsMemoryAccess_{false};

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

  /*
   * Removes animations from `inflightAnimations_` for stopped surfaces.
   */
  void deleteAnimationsForStoppedSurfaces() const;

  void simulateImagePropsMemoryAccess(
      ShadowViewMutationList const &mutations) const;
};

} // namespace react
} // namespace facebook
