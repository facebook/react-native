/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<51e9b65c32aa4a990f21afd4f0244223>>
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

import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
public interface ReactNativeFeatureFlagsProvider {
  @DoNotStrip public fun commonTestFlag(): Boolean

  @DoNotStrip public fun cdpInteractionMetricsEnabled(): Boolean

  @DoNotStrip public fun cxxNativeAnimatedEnabled(): Boolean

  @DoNotStrip public fun cxxNativeAnimatedRemoveJsSync(): Boolean

  @DoNotStrip public fun disableFabricCommitInCXXAnimated(): Boolean

  @DoNotStrip public fun disableMountItemReorderingAndroid(): Boolean

  @DoNotStrip public fun disableOldAndroidAttachmentMetricsWorkarounds(): Boolean

  @DoNotStrip public fun disableTextLayoutManagerCacheAndroid(): Boolean

  @DoNotStrip public fun enableAccessibilityOrder(): Boolean

  @DoNotStrip public fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean

  @DoNotStrip public fun enableAndroidTextMeasurementOptimizations(): Boolean

  @DoNotStrip public fun enableBridgelessArchitecture(): Boolean

  @DoNotStrip public fun enableCppPropsIteratorSetter(): Boolean

  @DoNotStrip public fun enableCustomFocusSearchOnClippedElementsAndroid(): Boolean

  @DoNotStrip public fun enableDestroyShadowTreeRevisionAsync(): Boolean

  @DoNotStrip public fun enableDoubleMeasurementFixAndroid(): Boolean

  @DoNotStrip public fun enableEagerMainQueueModulesOnIOS(): Boolean

  @DoNotStrip public fun enableEagerRootViewAttachment(): Boolean

  @DoNotStrip public fun enableFabricLogs(): Boolean

  @DoNotStrip public fun enableFabricRenderer(): Boolean

  @DoNotStrip public fun enableFontScaleChangesUpdatingLayout(): Boolean

  @DoNotStrip public fun enableIOSTextBaselineOffsetPerLine(): Boolean

  @DoNotStrip public fun enableIOSViewClipToPaddingBox(): Boolean

  @DoNotStrip public fun enableImagePrefetchingAndroid(): Boolean

  @DoNotStrip public fun enableImmediateUpdateModeForContentOffsetChanges(): Boolean

  @DoNotStrip public fun enableInteropViewManagerClassLookUpOptimizationIOS(): Boolean

  @DoNotStrip public fun enableLayoutAnimationsOnAndroid(): Boolean

  @DoNotStrip public fun enableLayoutAnimationsOnIOS(): Boolean

  @DoNotStrip public fun enableMainQueueCoordinatorOnIOS(): Boolean

  @DoNotStrip public fun enableModuleArgumentNSNullConversionIOS(): Boolean

  @DoNotStrip public fun enableNativeCSSParsing(): Boolean

  @DoNotStrip public fun enableNetworkEventReporting(): Boolean

  @DoNotStrip public fun enableNewBackgroundAndBorderDrawables(): Boolean

  @DoNotStrip public fun enablePreparedTextLayout(): Boolean

  @DoNotStrip public fun enablePropsUpdateReconciliationAndroid(): Boolean

  @DoNotStrip public fun enableResourceTimingAPI(): Boolean

  @DoNotStrip public fun enableViewCulling(): Boolean

  @DoNotStrip public fun enableViewRecycling(): Boolean

  @DoNotStrip public fun enableViewRecyclingForScrollView(): Boolean

  @DoNotStrip public fun enableViewRecyclingForText(): Boolean

  @DoNotStrip public fun enableViewRecyclingForView(): Boolean

  @DoNotStrip public fun enableVirtualViewDebugFeatures(): Boolean

  @DoNotStrip public fun enableVirtualViewRenderState(): Boolean

  @DoNotStrip public fun enableVirtualViewWindowFocusDetection(): Boolean

  @DoNotStrip public fun enableWebPerformanceAPIsByDefault(): Boolean

  @DoNotStrip public fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean

  @DoNotStrip public fun fuseboxEnabledRelease(): Boolean

  @DoNotStrip public fun fuseboxNetworkInspectionEnabled(): Boolean

  @DoNotStrip public fun hideOffscreenVirtualViewsOnIOS(): Boolean

  @DoNotStrip public fun perfMonitorV2Enabled(): Boolean

  @DoNotStrip public fun preparedTextCacheSize(): Double

  @DoNotStrip public fun preventShadowTreeCommitExhaustion(): Boolean

  @DoNotStrip public fun releaseImageDataWhenConsumed(): Boolean

  @DoNotStrip public fun shouldPressibilityUseW3CPointerEventsForHover(): Boolean

  @DoNotStrip public fun skipActivityIdentityAssertionOnHostPause(): Boolean

  @DoNotStrip public fun sweepActiveTouchOnChildNativeGesturesAndroid(): Boolean

  @DoNotStrip public fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean

  @DoNotStrip public fun updateRuntimeShadowNodeReferencesOnCommit(): Boolean

  @DoNotStrip public fun useAlwaysAvailableJSErrorHandling(): Boolean

  @DoNotStrip public fun useFabricInterop(): Boolean

  @DoNotStrip public fun useNativeEqualsInNativeReadableArrayAndroid(): Boolean

  @DoNotStrip public fun useNativeTransformHelperAndroid(): Boolean

  @DoNotStrip public fun useNativeViewConfigsInBridgelessMode(): Boolean

  @DoNotStrip public fun useOptimizedEventBatchingOnAndroid(): Boolean

  @DoNotStrip public fun useRawPropsJsiValue(): Boolean

  @DoNotStrip public fun useShadowNodeStateOnClone(): Boolean

  @DoNotStrip public fun useTurboModuleInterop(): Boolean

  @DoNotStrip public fun useTurboModules(): Boolean

  @DoNotStrip public fun virtualViewHysteresisRatio(): Double

  @DoNotStrip public fun virtualViewPrerenderRatio(): Double
}
