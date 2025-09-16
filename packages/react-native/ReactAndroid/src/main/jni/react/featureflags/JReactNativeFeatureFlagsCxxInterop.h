/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<d34119ad2e9a068463e8a31ecced59d9>>
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

  static bool cdpInteractionMetricsEnabled(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool cxxNativeAnimatedEnabled(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool cxxNativeAnimatedRemoveJsSync(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool disableFabricCommitInCXXAnimated(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool disableMountItemReorderingAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool disableOldAndroidAttachmentMetricsWorkarounds(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool disableTextLayoutManagerCacheAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableAccessibilityOrder(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableAccumulatedUpdatesInRawPropsAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableAndroidTextMeasurementOptimizations(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableBridgelessArchitecture(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableCppPropsIteratorSetter(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableCustomFocusSearchOnClippedElementsAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableDestroyShadowTreeRevisionAsync(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableDoubleMeasurementFixAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableEagerMainQueueModulesOnIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableEagerRootViewAttachment(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableFabricLogs(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableFabricRenderer(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableFontScaleChangesUpdatingLayout(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableIOSTextBaselineOffsetPerLine(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableIOSViewClipToPaddingBox(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableImagePrefetchingAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableImmediateUpdateModeForContentOffsetChanges(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableInteropViewManagerClassLookUpOptimizationIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableLayoutAnimationsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableLayoutAnimationsOnIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableMainQueueCoordinatorOnIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableModuleArgumentNSNullConversionIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableNativeCSSParsing(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableNetworkEventReporting(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableNewBackgroundAndBorderDrawables(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enablePreparedTextLayout(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enablePropsUpdateReconciliationAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableResourceTimingAPI(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableViewCulling(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableViewRecycling(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableViewRecyclingForScrollView(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableViewRecyclingForText(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableViewRecyclingForView(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableVirtualViewDebugFeatures(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableVirtualViewRenderState(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableVirtualViewWindowFocusDetection(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool enableWebPerformanceAPIsByDefault(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fixMappingOfEventPrioritiesBetweenFabricAndReact(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fuseboxEnabledRelease(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool fuseboxNetworkInspectionEnabled(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool hideOffscreenVirtualViewsOnIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool perfMonitorV2Enabled(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static double preparedTextCacheSize(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool preventShadowTreeCommitExhaustion(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool releaseImageDataWhenConsumed(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool shouldPressibilityUseW3CPointerEventsForHover(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool skipActivityIdentityAssertionOnHostPause(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool sweepActiveTouchOnChildNativeGesturesAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool traceTurboModulePromiseRejectionsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool updateRuntimeShadowNodeReferencesOnCommit(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useAlwaysAvailableJSErrorHandling(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useFabricInterop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useNativeEqualsInNativeReadableArrayAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useNativeTransformHelperAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useNativeViewConfigsInBridgelessMode(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useOptimizedEventBatchingOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useRawPropsJsiValue(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useShadowNodeStateOnClone(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useTurboModuleInterop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static bool useTurboModules(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static double virtualViewHysteresisRatio(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop>);

  static double virtualViewPrerenderRatio(
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
