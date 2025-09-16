/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<70d501526baf497e55f9ca9a33b582ef>>
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

namespace facebook::react {

class ReactNativeFeatureFlagsProvider {
 public:
  virtual ~ReactNativeFeatureFlagsProvider() = default;

  virtual bool commonTestFlag() = 0;
  virtual bool cdpInteractionMetricsEnabled() = 0;
  virtual bool cxxNativeAnimatedEnabled() = 0;
  virtual bool cxxNativeAnimatedRemoveJsSync() = 0;
  virtual bool disableFabricCommitInCXXAnimated() = 0;
  virtual bool disableMountItemReorderingAndroid() = 0;
  virtual bool disableOldAndroidAttachmentMetricsWorkarounds() = 0;
  virtual bool disableTextLayoutManagerCacheAndroid() = 0;
  virtual bool enableAccessibilityOrder() = 0;
  virtual bool enableAccumulatedUpdatesInRawPropsAndroid() = 0;
  virtual bool enableAndroidTextMeasurementOptimizations() = 0;
  virtual bool enableBridgelessArchitecture() = 0;
  virtual bool enableCppPropsIteratorSetter() = 0;
  virtual bool enableCustomFocusSearchOnClippedElementsAndroid() = 0;
  virtual bool enableDestroyShadowTreeRevisionAsync() = 0;
  virtual bool enableDoubleMeasurementFixAndroid() = 0;
  virtual bool enableEagerMainQueueModulesOnIOS() = 0;
  virtual bool enableEagerRootViewAttachment() = 0;
  virtual bool enableFabricLogs() = 0;
  virtual bool enableFabricRenderer() = 0;
  virtual bool enableFontScaleChangesUpdatingLayout() = 0;
  virtual bool enableIOSTextBaselineOffsetPerLine() = 0;
  virtual bool enableIOSViewClipToPaddingBox() = 0;
  virtual bool enableImagePrefetchingAndroid() = 0;
  virtual bool enableImmediateUpdateModeForContentOffsetChanges() = 0;
  virtual bool enableInteropViewManagerClassLookUpOptimizationIOS() = 0;
  virtual bool enableLayoutAnimationsOnAndroid() = 0;
  virtual bool enableLayoutAnimationsOnIOS() = 0;
  virtual bool enableMainQueueCoordinatorOnIOS() = 0;
  virtual bool enableModuleArgumentNSNullConversionIOS() = 0;
  virtual bool enableNativeCSSParsing() = 0;
  virtual bool enableNetworkEventReporting() = 0;
  virtual bool enableNewBackgroundAndBorderDrawables() = 0;
  virtual bool enablePreparedTextLayout() = 0;
  virtual bool enablePropsUpdateReconciliationAndroid() = 0;
  virtual bool enableResourceTimingAPI() = 0;
  virtual bool enableViewCulling() = 0;
  virtual bool enableViewRecycling() = 0;
  virtual bool enableViewRecyclingForScrollView() = 0;
  virtual bool enableViewRecyclingForText() = 0;
  virtual bool enableViewRecyclingForView() = 0;
  virtual bool enableVirtualViewDebugFeatures() = 0;
  virtual bool enableVirtualViewRenderState() = 0;
  virtual bool enableVirtualViewWindowFocusDetection() = 0;
  virtual bool enableWebPerformanceAPIsByDefault() = 0;
  virtual bool fixMappingOfEventPrioritiesBetweenFabricAndReact() = 0;
  virtual bool fuseboxEnabledRelease() = 0;
  virtual bool fuseboxNetworkInspectionEnabled() = 0;
  virtual bool hideOffscreenVirtualViewsOnIOS() = 0;
  virtual bool perfMonitorV2Enabled() = 0;
  virtual double preparedTextCacheSize() = 0;
  virtual bool preventShadowTreeCommitExhaustion() = 0;
  virtual bool releaseImageDataWhenConsumed() = 0;
  virtual bool shouldPressibilityUseW3CPointerEventsForHover() = 0;
  virtual bool skipActivityIdentityAssertionOnHostPause() = 0;
  virtual bool sweepActiveTouchOnChildNativeGesturesAndroid() = 0;
  virtual bool traceTurboModulePromiseRejectionsOnAndroid() = 0;
  virtual bool updateRuntimeShadowNodeReferencesOnCommit() = 0;
  virtual bool useAlwaysAvailableJSErrorHandling() = 0;
  virtual bool useFabricInterop() = 0;
  virtual bool useNativeEqualsInNativeReadableArrayAndroid() = 0;
  virtual bool useNativeTransformHelperAndroid() = 0;
  virtual bool useNativeViewConfigsInBridgelessMode() = 0;
  virtual bool useOptimizedEventBatchingOnAndroid() = 0;
  virtual bool useRawPropsJsiValue() = 0;
  virtual bool useShadowNodeStateOnClone() = 0;
  virtual bool useTurboModuleInterop() = 0;
  virtual bool useTurboModules() = 0;
  virtual double virtualViewHysteresisRatio() = 0;
  virtual double virtualViewPrerenderRatio() = 0;
};

} // namespace facebook::react
