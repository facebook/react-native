/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<ca1bff402a7b8c5048b50e0a7c09c0da>>
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

#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>

namespace facebook::react {

class ReactNativeFeatureFlagsDefaults : public ReactNativeFeatureFlagsProvider {
 public:
  ReactNativeFeatureFlagsDefaults() = default;

  bool commonTestFlag() override {
    return false;
  }

  bool cdpInteractionMetricsEnabled() override {
    return false;
  }

  bool cxxNativeAnimatedEnabled() override {
    return false;
  }

  bool cxxNativeAnimatedRemoveJsSync() override {
    return false;
  }

  bool disableFabricCommitInCXXAnimated() override {
    return false;
  }

  bool disableMountItemReorderingAndroid() override {
    return false;
  }

  bool disableOldAndroidAttachmentMetricsWorkarounds() override {
    return true;
  }

  bool disableTextLayoutManagerCacheAndroid() override {
    return false;
  }

  bool enableAccessibilityOrder() override {
    return false;
  }

  bool enableAccumulatedUpdatesInRawPropsAndroid() override {
    return false;
  }

  bool enableAndroidTextMeasurementOptimizations() override {
    return false;
  }

  bool enableBridgelessArchitecture() override {
    return false;
  }

  bool enableCppPropsIteratorSetter() override {
    return false;
  }

  bool enableCustomFocusSearchOnClippedElementsAndroid() override {
    return true;
  }

  bool enableDestroyShadowTreeRevisionAsync() override {
    return false;
  }

  bool enableDoubleMeasurementFixAndroid() override {
    return false;
  }

  bool enableEagerMainQueueModulesOnIOS() override {
    return false;
  }

  bool enableEagerRootViewAttachment() override {
    return false;
  }

  bool enableFabricLogs() override {
    return false;
  }

  bool enableFabricRenderer() override {
    return false;
  }

  bool enableFontScaleChangesUpdatingLayout() override {
    return true;
  }

  bool enableIOSTextBaselineOffsetPerLine() override {
    return false;
  }

  bool enableIOSViewClipToPaddingBox() override {
    return false;
  }

  bool enableImagePrefetchingAndroid() override {
    return false;
  }

  bool enableImmediateUpdateModeForContentOffsetChanges() override {
    return false;
  }

  bool enableInteropViewManagerClassLookUpOptimizationIOS() override {
    return false;
  }

  bool enableLayoutAnimationsOnAndroid() override {
    return false;
  }

  bool enableLayoutAnimationsOnIOS() override {
    return true;
  }

  bool enableMainQueueCoordinatorOnIOS() override {
    return false;
  }

  bool enableModuleArgumentNSNullConversionIOS() override {
    return false;
  }

  bool enableNativeCSSParsing() override {
    return false;
  }

  bool enableNetworkEventReporting() override {
    return false;
  }

  bool enableNewBackgroundAndBorderDrawables() override {
    return true;
  }

  bool enablePreparedTextLayout() override {
    return false;
  }

  bool enablePropsUpdateReconciliationAndroid() override {
    return false;
  }

  bool enableResourceTimingAPI() override {
    return false;
  }

  bool enableViewCulling() override {
    return false;
  }

  bool enableViewRecycling() override {
    return false;
  }

  bool enableViewRecyclingForScrollView() override {
    return false;
  }

  bool enableViewRecyclingForText() override {
    return true;
  }

  bool enableViewRecyclingForView() override {
    return true;
  }

  bool enableVirtualViewDebugFeatures() override {
    return false;
  }

  bool enableVirtualViewRenderState() override {
    return true;
  }

  bool enableVirtualViewWindowFocusDetection() override {
    return false;
  }

  bool enableWebPerformanceAPIsByDefault() override {
    return false;
  }

  bool fixMappingOfEventPrioritiesBetweenFabricAndReact() override {
    return false;
  }

  bool fuseboxEnabledRelease() override {
    return false;
  }

  bool fuseboxNetworkInspectionEnabled() override {
    return false;
  }

  bool hideOffscreenVirtualViewsOnIOS() override {
    return false;
  }

  bool perfMonitorV2Enabled() override {
    return false;
  }

  double preparedTextCacheSize() override {
    return 200.0;
  }

  bool preventShadowTreeCommitExhaustion() override {
    return false;
  }

  bool releaseImageDataWhenConsumed() override {
    return false;
  }

  bool shouldPressibilityUseW3CPointerEventsForHover() override {
    return false;
  }

  bool skipActivityIdentityAssertionOnHostPause() override {
    return false;
  }

  bool sweepActiveTouchOnChildNativeGesturesAndroid() override {
    return false;
  }

  bool traceTurboModulePromiseRejectionsOnAndroid() override {
    return false;
  }

  bool updateRuntimeShadowNodeReferencesOnCommit() override {
    return false;
  }

  bool useAlwaysAvailableJSErrorHandling() override {
    return false;
  }

  bool useFabricInterop() override {
    return true;
  }

  bool useNativeEqualsInNativeReadableArrayAndroid() override {
    return true;
  }

  bool useNativeTransformHelperAndroid() override {
    return true;
  }

  bool useNativeViewConfigsInBridgelessMode() override {
    return false;
  }

  bool useOptimizedEventBatchingOnAndroid() override {
    return false;
  }

  bool useRawPropsJsiValue() override {
    return true;
  }

  bool useShadowNodeStateOnClone() override {
    return false;
  }

  bool useTurboModuleInterop() override {
    return false;
  }

  bool useTurboModules() override {
    return false;
  }

  double virtualViewHysteresisRatio() override {
    return 0.0;
  }

  double virtualViewPrerenderRatio() override {
    return 5.0;
  }
};

} // namespace facebook::react
