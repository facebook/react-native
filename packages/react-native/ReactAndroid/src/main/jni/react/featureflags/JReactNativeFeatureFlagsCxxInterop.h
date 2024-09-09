/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<89d0da3b2bb56a4ee3c887e6c57491b2>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>

namespace facebook::react {

class JReactNativeFeatureFlagsCxxInterop
    : public jni::JavaClass<JReactNativeFeatureFlagsCxxInterop> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/internal/featureflags/ReactNativeFeatureFlagsCxxInterop;";

  static bool commonTestFlag(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool allowRecursiveCommitsWithSynchronousMountOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool batchRenderingUpdatesInEventLoop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool completeReactInstanceCreationOnBgThreadOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool destroyFabricSurfacesInReactInstanceManager(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableAlignItemsBaselineOnFabricIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableAndroidMixBlendModeProp(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableBackgroundStyleApplicator(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableCleanTextInputYogaNode(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableEagerRootViewAttachment(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableEventEmitterRetentionDuringGesturesOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableFabricLogs(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableFabricRendererExclusively(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableGranularShadowTreeStateReconciliation(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableIOSViewClipToPaddingBox(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableLayoutAnimationsOnIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableLongTaskAPI(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableMicrotasks(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enablePropsUpdateReconciliationAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableReportEventPaintTime(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableSynchronousStateUpdates(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableUIConsistency(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableViewRecycling(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool excludeYogaFromRawProps(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fetchImagesInViewPreallocation(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fixIncorrectScrollViewStateUpdateOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fixMappingOfEventPrioritiesBetweenFabricAndReact(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fixMissedFabricStateUpdatesOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fixMountingCoordinatorReportedPendingTransactionsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool forceBatchingMountItemsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fuseboxEnabledDebug(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fuseboxEnabledRelease(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool initEagerTurboModulesOnNativeModulesQueueAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool lazyAnimationCallbacks(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool loadVectorDrawablesOnImages(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool setAndroidLayoutDirection(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool traceTurboModulePromiseRejectionsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useFabricInterop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useImmediateExecutorInAndroidBridgeless(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useModernRuntimeScheduler(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useNativeViewConfigsInBridgelessMode(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useNewReactImageViewBackgroundDrawing(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useOptimisedViewPreallocationOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useOptimizedEventBatchingOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useRuntimeShadowNodeReferenceUpdate(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useRuntimeShadowNodeReferenceUpdateOnLayout(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useStateAlignmentMechanism(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useTurboModuleInterop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static void override(
      facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>,
      jni::alias_ref<jobject> provider);

  static void dangerouslyReset(
      facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static void registerNatives();
};

} // namespace facebook::react
