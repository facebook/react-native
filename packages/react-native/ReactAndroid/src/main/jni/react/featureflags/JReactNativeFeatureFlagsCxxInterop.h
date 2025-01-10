/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<77b4ed5aa33290ba9da1719544e974cb>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags --update
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

  static bool completeReactInstanceCreationOnBgThreadOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool disableEventLoopOnBridgeless(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool disableMountItemReorderingAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableAccumulatedUpdatesInRawPropsAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableBridgelessArchitecture(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableCppPropsIteratorSetter(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableDeletionOfUnmountedViews(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableEagerRootViewAttachment(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableEventEmitterRetentionDuringGesturesOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableFabricLogs(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableFabricRenderer(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableFixForViewCommandRace(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableGranularShadowTreeStateReconciliation(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableIOSViewClipToPaddingBox(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableImagePrefetchingAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableLayoutAnimationsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableLayoutAnimationsOnIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableLongTaskAPI(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableNewBackgroundAndBorderDrawables(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enablePreciseSchedulingForPremountItemsOnAndroid(
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

  static bool fixDifferentiatorEmittingUpdatesWithWrongParentTag(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fixMappingOfEventPrioritiesBetweenFabricAndReact(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fixMountingCoordinatorReportedPendingTransactionsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fuseboxEnabledRelease(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool initEagerTurboModulesOnNativeModulesQueueAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool lazyAnimationCallbacks(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool loadVectorDrawablesOnImages(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool traceTurboModulePromiseRejectionsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useAlwaysAvailableJSErrorHandling(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useFabricInterop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useImmediateExecutorInAndroidBridgeless(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useNativeViewConfigsInBridgelessMode(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useOptimisedViewPreallocationOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useOptimizedEventBatchingOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useRawPropsJsiValue(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useRuntimeShadowNodeReferenceUpdate(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useTurboModuleInterop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useTurboModules(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static void override(
      facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>,
      jni::alias_ref<jobject> provider);

  static void dangerouslyReset(
      facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static jni::local_ref<jstring> dangerouslyForceOverride(
      facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>,
      jni::alias_ref<jobject> provider);

  static void registerNatives();
};

} // namespace facebook::react
