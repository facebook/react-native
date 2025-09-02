/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<3cbd83777e0840419fee9d582b4da692>>
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

internal class ReactNativeFeatureFlagsCxxAccessor : ReactNativeFeatureFlagsAccessor {
  private var commonTestFlagCache: Boolean? = null
  private var cdpInteractionMetricsEnabledCache: Boolean? = null
  private var cxxNativeAnimatedEnabledCache: Boolean? = null
  private var cxxNativeAnimatedRemoveJsSyncCache: Boolean? = null
  private var disableFabricCommitInCXXAnimatedCache: Boolean? = null
  private var disableMountItemReorderingAndroidCache: Boolean? = null
  private var disableOldAndroidAttachmentMetricsWorkaroundsCache: Boolean? = null
  private var disableTextLayoutManagerCacheAndroidCache: Boolean? = null
  private var enableAccessibilityOrderCache: Boolean? = null
  private var enableAccumulatedUpdatesInRawPropsAndroidCache: Boolean? = null
  private var enableAndroidTextMeasurementOptimizationsCache: Boolean? = null
  private var enableBridgelessArchitectureCache: Boolean? = null
  private var enableCppPropsIteratorSetterCache: Boolean? = null
  private var enableCustomFocusSearchOnClippedElementsAndroidCache: Boolean? = null
  private var enableDestroyShadowTreeRevisionAsyncCache: Boolean? = null
  private var enableDoubleMeasurementFixAndroidCache: Boolean? = null
  private var enableEagerMainQueueModulesOnIOSCache: Boolean? = null
  private var enableEagerRootViewAttachmentCache: Boolean? = null
  private var enableFabricLogsCache: Boolean? = null
  private var enableFabricRendererCache: Boolean? = null
  private var enableFontScaleChangesUpdatingLayoutCache: Boolean? = null
  private var enableIOSTextBaselineOffsetPerLineCache: Boolean? = null
  private var enableIOSViewClipToPaddingBoxCache: Boolean? = null
  private var enableImagePrefetchingAndroidCache: Boolean? = null
  private var enableImmediateUpdateModeForContentOffsetChangesCache: Boolean? = null
  private var enableInteropViewManagerClassLookUpOptimizationIOSCache: Boolean? = null
  private var enableLayoutAnimationsOnAndroidCache: Boolean? = null
  private var enableLayoutAnimationsOnIOSCache: Boolean? = null
  private var enableMainQueueCoordinatorOnIOSCache: Boolean? = null
  private var enableModuleArgumentNSNullConversionIOSCache: Boolean? = null
  private var enableNativeCSSParsingCache: Boolean? = null
  private var enableNetworkEventReportingCache: Boolean? = null
  private var enableNewBackgroundAndBorderDrawablesCache: Boolean? = null
  private var enablePreparedTextLayoutCache: Boolean? = null
  private var enablePropsUpdateReconciliationAndroidCache: Boolean? = null
  private var enableResourceTimingAPICache: Boolean? = null
  private var enableViewCullingCache: Boolean? = null
  private var enableViewRecyclingCache: Boolean? = null
  private var enableViewRecyclingForScrollViewCache: Boolean? = null
  private var enableViewRecyclingForTextCache: Boolean? = null
  private var enableViewRecyclingForViewCache: Boolean? = null
  private var enableVirtualViewDebugFeaturesCache: Boolean? = null
  private var enableVirtualViewRenderStateCache: Boolean? = null
  private var enableVirtualViewWindowFocusDetectionCache: Boolean? = null
  private var enableWebPerformanceAPIsByDefaultCache: Boolean? = null
  private var fixMappingOfEventPrioritiesBetweenFabricAndReactCache: Boolean? = null
  private var fuseboxEnabledReleaseCache: Boolean? = null
  private var fuseboxNetworkInspectionEnabledCache: Boolean? = null
  private var hideOffscreenVirtualViewsOnIOSCache: Boolean? = null
  private var perfMonitorV2EnabledCache: Boolean? = null
  private var preparedTextCacheSizeCache: Double? = null
  private var preventShadowTreeCommitExhaustionCache: Boolean? = null
  private var releaseImageDataWhenConsumedCache: Boolean? = null
  private var shouldPressibilityUseW3CPointerEventsForHoverCache: Boolean? = null
  private var skipActivityIdentityAssertionOnHostPauseCache: Boolean? = null
  private var sweepActiveTouchOnChildNativeGesturesAndroidCache: Boolean? = null
  private var traceTurboModulePromiseRejectionsOnAndroidCache: Boolean? = null
  private var updateRuntimeShadowNodeReferencesOnCommitCache: Boolean? = null
  private var useAlwaysAvailableJSErrorHandlingCache: Boolean? = null
  private var useFabricInteropCache: Boolean? = null
  private var useNativeEqualsInNativeReadableArrayAndroidCache: Boolean? = null
  private var useNativeTransformHelperAndroidCache: Boolean? = null
  private var useNativeViewConfigsInBridgelessModeCache: Boolean? = null
  private var useOptimizedEventBatchingOnAndroidCache: Boolean? = null
  private var useRawPropsJsiValueCache: Boolean? = null
  private var useShadowNodeStateOnCloneCache: Boolean? = null
  private var useTurboModuleInteropCache: Boolean? = null
  private var useTurboModulesCache: Boolean? = null
  private var virtualViewHysteresisRatioCache: Double? = null
  private var virtualViewPrerenderRatioCache: Double? = null

  override fun commonTestFlag(): Boolean {
    var cached = commonTestFlagCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.commonTestFlag()
      commonTestFlagCache = cached
    }
    return cached
  }

  override fun cdpInteractionMetricsEnabled(): Boolean {
    var cached = cdpInteractionMetricsEnabledCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.cdpInteractionMetricsEnabled()
      cdpInteractionMetricsEnabledCache = cached
    }
    return cached
  }

  override fun cxxNativeAnimatedEnabled(): Boolean {
    var cached = cxxNativeAnimatedEnabledCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.cxxNativeAnimatedEnabled()
      cxxNativeAnimatedEnabledCache = cached
    }
    return cached
  }

  override fun cxxNativeAnimatedRemoveJsSync(): Boolean {
    var cached = cxxNativeAnimatedRemoveJsSyncCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.cxxNativeAnimatedRemoveJsSync()
      cxxNativeAnimatedRemoveJsSyncCache = cached
    }
    return cached
  }

  override fun disableFabricCommitInCXXAnimated(): Boolean {
    var cached = disableFabricCommitInCXXAnimatedCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.disableFabricCommitInCXXAnimated()
      disableFabricCommitInCXXAnimatedCache = cached
    }
    return cached
  }

  override fun disableMountItemReorderingAndroid(): Boolean {
    var cached = disableMountItemReorderingAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.disableMountItemReorderingAndroid()
      disableMountItemReorderingAndroidCache = cached
    }
    return cached
  }

  override fun disableOldAndroidAttachmentMetricsWorkarounds(): Boolean {
    var cached = disableOldAndroidAttachmentMetricsWorkaroundsCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.disableOldAndroidAttachmentMetricsWorkarounds()
      disableOldAndroidAttachmentMetricsWorkaroundsCache = cached
    }
    return cached
  }

  override fun disableTextLayoutManagerCacheAndroid(): Boolean {
    var cached = disableTextLayoutManagerCacheAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.disableTextLayoutManagerCacheAndroid()
      disableTextLayoutManagerCacheAndroidCache = cached
    }
    return cached
  }

  override fun enableAccessibilityOrder(): Boolean {
    var cached = enableAccessibilityOrderCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableAccessibilityOrder()
      enableAccessibilityOrderCache = cached
    }
    return cached
  }

  override fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean {
    var cached = enableAccumulatedUpdatesInRawPropsAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableAccumulatedUpdatesInRawPropsAndroid()
      enableAccumulatedUpdatesInRawPropsAndroidCache = cached
    }
    return cached
  }

  override fun enableAndroidTextMeasurementOptimizations(): Boolean {
    var cached = enableAndroidTextMeasurementOptimizationsCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableAndroidTextMeasurementOptimizations()
      enableAndroidTextMeasurementOptimizationsCache = cached
    }
    return cached
  }

  override fun enableBridgelessArchitecture(): Boolean {
    var cached = enableBridgelessArchitectureCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableBridgelessArchitecture()
      enableBridgelessArchitectureCache = cached
    }
    return cached
  }

  override fun enableCppPropsIteratorSetter(): Boolean {
    var cached = enableCppPropsIteratorSetterCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableCppPropsIteratorSetter()
      enableCppPropsIteratorSetterCache = cached
    }
    return cached
  }

  override fun enableCustomFocusSearchOnClippedElementsAndroid(): Boolean {
    var cached = enableCustomFocusSearchOnClippedElementsAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableCustomFocusSearchOnClippedElementsAndroid()
      enableCustomFocusSearchOnClippedElementsAndroidCache = cached
    }
    return cached
  }

  override fun enableDestroyShadowTreeRevisionAsync(): Boolean {
    var cached = enableDestroyShadowTreeRevisionAsyncCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableDestroyShadowTreeRevisionAsync()
      enableDestroyShadowTreeRevisionAsyncCache = cached
    }
    return cached
  }

  override fun enableDoubleMeasurementFixAndroid(): Boolean {
    var cached = enableDoubleMeasurementFixAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableDoubleMeasurementFixAndroid()
      enableDoubleMeasurementFixAndroidCache = cached
    }
    return cached
  }

  override fun enableEagerMainQueueModulesOnIOS(): Boolean {
    var cached = enableEagerMainQueueModulesOnIOSCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableEagerMainQueueModulesOnIOS()
      enableEagerMainQueueModulesOnIOSCache = cached
    }
    return cached
  }

  override fun enableEagerRootViewAttachment(): Boolean {
    var cached = enableEagerRootViewAttachmentCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableEagerRootViewAttachment()
      enableEagerRootViewAttachmentCache = cached
    }
    return cached
  }

  override fun enableFabricLogs(): Boolean {
    var cached = enableFabricLogsCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableFabricLogs()
      enableFabricLogsCache = cached
    }
    return cached
  }

  override fun enableFabricRenderer(): Boolean {
    var cached = enableFabricRendererCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableFabricRenderer()
      enableFabricRendererCache = cached
    }
    return cached
  }

  override fun enableFontScaleChangesUpdatingLayout(): Boolean {
    var cached = enableFontScaleChangesUpdatingLayoutCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableFontScaleChangesUpdatingLayout()
      enableFontScaleChangesUpdatingLayoutCache = cached
    }
    return cached
  }

  override fun enableIOSTextBaselineOffsetPerLine(): Boolean {
    var cached = enableIOSTextBaselineOffsetPerLineCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableIOSTextBaselineOffsetPerLine()
      enableIOSTextBaselineOffsetPerLineCache = cached
    }
    return cached
  }

  override fun enableIOSViewClipToPaddingBox(): Boolean {
    var cached = enableIOSViewClipToPaddingBoxCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableIOSViewClipToPaddingBox()
      enableIOSViewClipToPaddingBoxCache = cached
    }
    return cached
  }

  override fun enableImagePrefetchingAndroid(): Boolean {
    var cached = enableImagePrefetchingAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableImagePrefetchingAndroid()
      enableImagePrefetchingAndroidCache = cached
    }
    return cached
  }

  override fun enableImmediateUpdateModeForContentOffsetChanges(): Boolean {
    var cached = enableImmediateUpdateModeForContentOffsetChangesCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableImmediateUpdateModeForContentOffsetChanges()
      enableImmediateUpdateModeForContentOffsetChangesCache = cached
    }
    return cached
  }

  override fun enableInteropViewManagerClassLookUpOptimizationIOS(): Boolean {
    var cached = enableInteropViewManagerClassLookUpOptimizationIOSCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableInteropViewManagerClassLookUpOptimizationIOS()
      enableInteropViewManagerClassLookUpOptimizationIOSCache = cached
    }
    return cached
  }

  override fun enableLayoutAnimationsOnAndroid(): Boolean {
    var cached = enableLayoutAnimationsOnAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableLayoutAnimationsOnAndroid()
      enableLayoutAnimationsOnAndroidCache = cached
    }
    return cached
  }

  override fun enableLayoutAnimationsOnIOS(): Boolean {
    var cached = enableLayoutAnimationsOnIOSCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableLayoutAnimationsOnIOS()
      enableLayoutAnimationsOnIOSCache = cached
    }
    return cached
  }

  override fun enableMainQueueCoordinatorOnIOS(): Boolean {
    var cached = enableMainQueueCoordinatorOnIOSCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableMainQueueCoordinatorOnIOS()
      enableMainQueueCoordinatorOnIOSCache = cached
    }
    return cached
  }

  override fun enableModuleArgumentNSNullConversionIOS(): Boolean {
    var cached = enableModuleArgumentNSNullConversionIOSCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableModuleArgumentNSNullConversionIOS()
      enableModuleArgumentNSNullConversionIOSCache = cached
    }
    return cached
  }

  override fun enableNativeCSSParsing(): Boolean {
    var cached = enableNativeCSSParsingCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableNativeCSSParsing()
      enableNativeCSSParsingCache = cached
    }
    return cached
  }

  override fun enableNetworkEventReporting(): Boolean {
    var cached = enableNetworkEventReportingCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableNetworkEventReporting()
      enableNetworkEventReportingCache = cached
    }
    return cached
  }

  override fun enableNewBackgroundAndBorderDrawables(): Boolean {
    var cached = enableNewBackgroundAndBorderDrawablesCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableNewBackgroundAndBorderDrawables()
      enableNewBackgroundAndBorderDrawablesCache = cached
    }
    return cached
  }

  override fun enablePreparedTextLayout(): Boolean {
    var cached = enablePreparedTextLayoutCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enablePreparedTextLayout()
      enablePreparedTextLayoutCache = cached
    }
    return cached
  }

  override fun enablePropsUpdateReconciliationAndroid(): Boolean {
    var cached = enablePropsUpdateReconciliationAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enablePropsUpdateReconciliationAndroid()
      enablePropsUpdateReconciliationAndroidCache = cached
    }
    return cached
  }

  override fun enableResourceTimingAPI(): Boolean {
    var cached = enableResourceTimingAPICache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableResourceTimingAPI()
      enableResourceTimingAPICache = cached
    }
    return cached
  }

  override fun enableViewCulling(): Boolean {
    var cached = enableViewCullingCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableViewCulling()
      enableViewCullingCache = cached
    }
    return cached
  }

  override fun enableViewRecycling(): Boolean {
    var cached = enableViewRecyclingCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableViewRecycling()
      enableViewRecyclingCache = cached
    }
    return cached
  }

  override fun enableViewRecyclingForScrollView(): Boolean {
    var cached = enableViewRecyclingForScrollViewCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableViewRecyclingForScrollView()
      enableViewRecyclingForScrollViewCache = cached
    }
    return cached
  }

  override fun enableViewRecyclingForText(): Boolean {
    var cached = enableViewRecyclingForTextCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableViewRecyclingForText()
      enableViewRecyclingForTextCache = cached
    }
    return cached
  }

  override fun enableViewRecyclingForView(): Boolean {
    var cached = enableViewRecyclingForViewCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableViewRecyclingForView()
      enableViewRecyclingForViewCache = cached
    }
    return cached
  }

  override fun enableVirtualViewDebugFeatures(): Boolean {
    var cached = enableVirtualViewDebugFeaturesCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableVirtualViewDebugFeatures()
      enableVirtualViewDebugFeaturesCache = cached
    }
    return cached
  }

  override fun enableVirtualViewRenderState(): Boolean {
    var cached = enableVirtualViewRenderStateCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableVirtualViewRenderState()
      enableVirtualViewRenderStateCache = cached
    }
    return cached
  }

  override fun enableVirtualViewWindowFocusDetection(): Boolean {
    var cached = enableVirtualViewWindowFocusDetectionCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableVirtualViewWindowFocusDetection()
      enableVirtualViewWindowFocusDetectionCache = cached
    }
    return cached
  }

  override fun enableWebPerformanceAPIsByDefault(): Boolean {
    var cached = enableWebPerformanceAPIsByDefaultCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableWebPerformanceAPIsByDefault()
      enableWebPerformanceAPIsByDefaultCache = cached
    }
    return cached
  }

  override fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean {
    var cached = fixMappingOfEventPrioritiesBetweenFabricAndReactCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.fixMappingOfEventPrioritiesBetweenFabricAndReact()
      fixMappingOfEventPrioritiesBetweenFabricAndReactCache = cached
    }
    return cached
  }

  override fun fuseboxEnabledRelease(): Boolean {
    var cached = fuseboxEnabledReleaseCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.fuseboxEnabledRelease()
      fuseboxEnabledReleaseCache = cached
    }
    return cached
  }

  override fun fuseboxNetworkInspectionEnabled(): Boolean {
    var cached = fuseboxNetworkInspectionEnabledCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.fuseboxNetworkInspectionEnabled()
      fuseboxNetworkInspectionEnabledCache = cached
    }
    return cached
  }

  override fun hideOffscreenVirtualViewsOnIOS(): Boolean {
    var cached = hideOffscreenVirtualViewsOnIOSCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.hideOffscreenVirtualViewsOnIOS()
      hideOffscreenVirtualViewsOnIOSCache = cached
    }
    return cached
  }

  override fun perfMonitorV2Enabled(): Boolean {
    var cached = perfMonitorV2EnabledCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.perfMonitorV2Enabled()
      perfMonitorV2EnabledCache = cached
    }
    return cached
  }

  override fun preparedTextCacheSize(): Double {
    var cached = preparedTextCacheSizeCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.preparedTextCacheSize()
      preparedTextCacheSizeCache = cached
    }
    return cached
  }

  override fun preventShadowTreeCommitExhaustion(): Boolean {
    var cached = preventShadowTreeCommitExhaustionCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.preventShadowTreeCommitExhaustion()
      preventShadowTreeCommitExhaustionCache = cached
    }
    return cached
  }

  override fun releaseImageDataWhenConsumed(): Boolean {
    var cached = releaseImageDataWhenConsumedCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.releaseImageDataWhenConsumed()
      releaseImageDataWhenConsumedCache = cached
    }
    return cached
  }

  override fun shouldPressibilityUseW3CPointerEventsForHover(): Boolean {
    var cached = shouldPressibilityUseW3CPointerEventsForHoverCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.shouldPressibilityUseW3CPointerEventsForHover()
      shouldPressibilityUseW3CPointerEventsForHoverCache = cached
    }
    return cached
  }

  override fun skipActivityIdentityAssertionOnHostPause(): Boolean {
    var cached = skipActivityIdentityAssertionOnHostPauseCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.skipActivityIdentityAssertionOnHostPause()
      skipActivityIdentityAssertionOnHostPauseCache = cached
    }
    return cached
  }

  override fun sweepActiveTouchOnChildNativeGesturesAndroid(): Boolean {
    var cached = sweepActiveTouchOnChildNativeGesturesAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.sweepActiveTouchOnChildNativeGesturesAndroid()
      sweepActiveTouchOnChildNativeGesturesAndroidCache = cached
    }
    return cached
  }

  override fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean {
    var cached = traceTurboModulePromiseRejectionsOnAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.traceTurboModulePromiseRejectionsOnAndroid()
      traceTurboModulePromiseRejectionsOnAndroidCache = cached
    }
    return cached
  }

  override fun updateRuntimeShadowNodeReferencesOnCommit(): Boolean {
    var cached = updateRuntimeShadowNodeReferencesOnCommitCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.updateRuntimeShadowNodeReferencesOnCommit()
      updateRuntimeShadowNodeReferencesOnCommitCache = cached
    }
    return cached
  }

  override fun useAlwaysAvailableJSErrorHandling(): Boolean {
    var cached = useAlwaysAvailableJSErrorHandlingCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useAlwaysAvailableJSErrorHandling()
      useAlwaysAvailableJSErrorHandlingCache = cached
    }
    return cached
  }

  override fun useFabricInterop(): Boolean {
    var cached = useFabricInteropCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useFabricInterop()
      useFabricInteropCache = cached
    }
    return cached
  }

  override fun useNativeEqualsInNativeReadableArrayAndroid(): Boolean {
    var cached = useNativeEqualsInNativeReadableArrayAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useNativeEqualsInNativeReadableArrayAndroid()
      useNativeEqualsInNativeReadableArrayAndroidCache = cached
    }
    return cached
  }

  override fun useNativeTransformHelperAndroid(): Boolean {
    var cached = useNativeTransformHelperAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useNativeTransformHelperAndroid()
      useNativeTransformHelperAndroidCache = cached
    }
    return cached
  }

  override fun useNativeViewConfigsInBridgelessMode(): Boolean {
    var cached = useNativeViewConfigsInBridgelessModeCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useNativeViewConfigsInBridgelessMode()
      useNativeViewConfigsInBridgelessModeCache = cached
    }
    return cached
  }

  override fun useOptimizedEventBatchingOnAndroid(): Boolean {
    var cached = useOptimizedEventBatchingOnAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useOptimizedEventBatchingOnAndroid()
      useOptimizedEventBatchingOnAndroidCache = cached
    }
    return cached
  }

  override fun useRawPropsJsiValue(): Boolean {
    var cached = useRawPropsJsiValueCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useRawPropsJsiValue()
      useRawPropsJsiValueCache = cached
    }
    return cached
  }

  override fun useShadowNodeStateOnClone(): Boolean {
    var cached = useShadowNodeStateOnCloneCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useShadowNodeStateOnClone()
      useShadowNodeStateOnCloneCache = cached
    }
    return cached
  }

  override fun useTurboModuleInterop(): Boolean {
    var cached = useTurboModuleInteropCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useTurboModuleInterop()
      useTurboModuleInteropCache = cached
    }
    return cached
  }

  override fun useTurboModules(): Boolean {
    var cached = useTurboModulesCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useTurboModules()
      useTurboModulesCache = cached
    }
    return cached
  }

  override fun virtualViewHysteresisRatio(): Double {
    var cached = virtualViewHysteresisRatioCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.virtualViewHysteresisRatio()
      virtualViewHysteresisRatioCache = cached
    }
    return cached
  }

  override fun virtualViewPrerenderRatio(): Double {
    var cached = virtualViewPrerenderRatioCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.virtualViewPrerenderRatio()
      virtualViewPrerenderRatioCache = cached
    }
    return cached
  }

  override fun override(provider: ReactNativeFeatureFlagsProvider): Unit =
      ReactNativeFeatureFlagsCxxInterop.override(provider as Any)

  override fun dangerouslyReset(): Unit = ReactNativeFeatureFlagsCxxInterop.dangerouslyReset()

  override fun dangerouslyForceOverride(provider: ReactNativeFeatureFlagsProvider): String? =
      ReactNativeFeatureFlagsCxxInterop.dangerouslyForceOverride(provider as Any)
}
