/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<71354bd41b222239b80129659f5f5d21>>
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

package com.facebook.react.internal.featureflags

public open class ReactNativeFeatureFlagsDefaults : ReactNativeFeatureFlagsProvider {
  // We could use JNI to get the defaults from C++,
  // but that is more expensive than just duplicating the defaults here.

  override fun commonTestFlag(): Boolean = false

  override fun cdpInteractionMetricsEnabled(): Boolean = false

  override fun cxxNativeAnimatedEnabled(): Boolean = false

  override fun cxxNativeAnimatedRemoveJsSync(): Boolean = false

  override fun disableFabricCommitInCXXAnimated(): Boolean = false

  override fun disableMountItemReorderingAndroid(): Boolean = false

  override fun disableOldAndroidAttachmentMetricsWorkarounds(): Boolean = true

  override fun disableTextLayoutManagerCacheAndroid(): Boolean = false

  override fun enableAccessibilityOrder(): Boolean = false

  override fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean = false

  override fun enableAndroidTextMeasurementOptimizations(): Boolean = false

  override fun enableBridgelessArchitecture(): Boolean = false

  override fun enableCppPropsIteratorSetter(): Boolean = false

  override fun enableCustomFocusSearchOnClippedElementsAndroid(): Boolean = true

  override fun enableDestroyShadowTreeRevisionAsync(): Boolean = false

  override fun enableDoubleMeasurementFixAndroid(): Boolean = false

  override fun enableEagerMainQueueModulesOnIOS(): Boolean = false

  override fun enableEagerRootViewAttachment(): Boolean = false

  override fun enableFabricLogs(): Boolean = false

  override fun enableFabricRenderer(): Boolean = false

  override fun enableFontScaleChangesUpdatingLayout(): Boolean = true

  override fun enableIOSTextBaselineOffsetPerLine(): Boolean = false

  override fun enableIOSViewClipToPaddingBox(): Boolean = false

  override fun enableImagePrefetchingAndroid(): Boolean = false

  override fun enableImmediateUpdateModeForContentOffsetChanges(): Boolean = false

  override fun enableInteropViewManagerClassLookUpOptimizationIOS(): Boolean = false

  override fun enableLayoutAnimationsOnAndroid(): Boolean = false

  override fun enableLayoutAnimationsOnIOS(): Boolean = true

  override fun enableMainQueueCoordinatorOnIOS(): Boolean = false

  override fun enableModuleArgumentNSNullConversionIOS(): Boolean = false

  override fun enableNativeCSSParsing(): Boolean = false

  override fun enableNetworkEventReporting(): Boolean = false

  override fun enableNewBackgroundAndBorderDrawables(): Boolean = true

  override fun enablePreparedTextLayout(): Boolean = false

  override fun enablePropsUpdateReconciliationAndroid(): Boolean = false

  override fun enableResourceTimingAPI(): Boolean = false

  override fun enableViewCulling(): Boolean = false

  override fun enableViewRecycling(): Boolean = false

  override fun enableViewRecyclingForScrollView(): Boolean = false

  override fun enableViewRecyclingForText(): Boolean = true

  override fun enableViewRecyclingForView(): Boolean = true

  override fun enableVirtualViewDebugFeatures(): Boolean = false

  override fun enableVirtualViewRenderState(): Boolean = true

  override fun enableVirtualViewWindowFocusDetection(): Boolean = false

  override fun enableWebPerformanceAPIsByDefault(): Boolean = false

  override fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean = false

  override fun fuseboxEnabledRelease(): Boolean = false

  override fun fuseboxNetworkInspectionEnabled(): Boolean = false

  override fun hideOffscreenVirtualViewsOnIOS(): Boolean = false

  override fun perfMonitorV2Enabled(): Boolean = false

  override fun preparedTextCacheSize(): Double = 200.0

  override fun preventShadowTreeCommitExhaustion(): Boolean = false

  override fun releaseImageDataWhenConsumed(): Boolean = false

  override fun shouldPressibilityUseW3CPointerEventsForHover(): Boolean = false

  override fun skipActivityIdentityAssertionOnHostPause(): Boolean = false

  override fun sweepActiveTouchOnChildNativeGesturesAndroid(): Boolean = false

  override fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean = false

  override fun updateRuntimeShadowNodeReferencesOnCommit(): Boolean = false

  override fun useAlwaysAvailableJSErrorHandling(): Boolean = false

  override fun useFabricInterop(): Boolean = true

  override fun useNativeEqualsInNativeReadableArrayAndroid(): Boolean = true

  override fun useNativeTransformHelperAndroid(): Boolean = true

  override fun useNativeViewConfigsInBridgelessMode(): Boolean = false

  override fun useOptimizedEventBatchingOnAndroid(): Boolean = false

  override fun useRawPropsJsiValue(): Boolean = true

  override fun useShadowNodeStateOnClone(): Boolean = false

  override fun useTurboModuleInterop(): Boolean = false

  override fun useTurboModules(): Boolean = false

  override fun virtualViewHysteresisRatio(): Double = 0.0

  override fun virtualViewPrerenderRatio(): Double = 5.0
}
