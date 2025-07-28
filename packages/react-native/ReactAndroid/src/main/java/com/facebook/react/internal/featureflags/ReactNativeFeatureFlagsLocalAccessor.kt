/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<3ea9946ef21c8ac8bb9bb63712636e89>>
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

internal class ReactNativeFeatureFlagsLocalAccessor : ReactNativeFeatureFlagsAccessor {
  private var currentProvider: ReactNativeFeatureFlagsProvider = ReactNativeFeatureFlagsDefaults()

  private val accessedFeatureFlags = mutableSetOf<String>()

  private var commonTestFlagCache: Boolean? = null
  private var animatedShouldSignalBatchCache: Boolean? = null
  private var cxxNativeAnimatedEnabledCache: Boolean? = null
  private var cxxNativeAnimatedRemoveJsSyncCache: Boolean? = null
  private var disableMainQueueSyncDispatchIOSCache: Boolean? = null
  private var disableMountItemReorderingAndroidCache: Boolean? = null
  private var disableTextLayoutManagerCacheAndroidCache: Boolean? = null
  private var enableAccessibilityOrderCache: Boolean? = null
  private var enableAccumulatedUpdatesInRawPropsAndroidCache: Boolean? = null
  private var enableAndroidTextMeasurementOptimizationsCache: Boolean? = null
  private var enableBridgelessArchitectureCache: Boolean? = null
  private var enableCppPropsIteratorSetterCache: Boolean? = null
  private var enableCustomFocusSearchOnClippedElementsAndroidCache: Boolean? = null
  private var enableDestroyShadowTreeRevisionAsyncCache: Boolean? = null
  private var enableDoubleMeasurementFixAndroidCache: Boolean? = null
  private var enableEagerRootViewAttachmentCache: Boolean? = null
  private var enableFabricLogsCache: Boolean? = null
  private var enableFabricRendererCache: Boolean? = null
  private var enableFixForParentTagDuringReparentingCache: Boolean? = null
  private var enableFontScaleChangesUpdatingLayoutCache: Boolean? = null
  private var enableIOSTextBaselineOffsetPerLineCache: Boolean? = null
  private var enableIOSViewClipToPaddingBoxCache: Boolean? = null
  private var enableInteropViewManagerClassLookUpOptimizationIOSCache: Boolean? = null
  private var enableLayoutAnimationsOnAndroidCache: Boolean? = null
  private var enableLayoutAnimationsOnIOSCache: Boolean? = null
  private var enableMainQueueCoordinatorOnIOSCache: Boolean? = null
  private var enableMainQueueModulesOnIOSCache: Boolean? = null
  private var enableModuleArgumentNSNullConversionIOSCache: Boolean? = null
  private var enableNativeCSSParsingCache: Boolean? = null
  private var enableNetworkEventReportingCache: Boolean? = null
  private var enableNewBackgroundAndBorderDrawablesCache: Boolean? = null
  private var enablePreparedTextLayoutCache: Boolean? = null
  private var enablePropsUpdateReconciliationAndroidCache: Boolean? = null
  private var enableResourceTimingAPICache: Boolean? = null
  private var enableSynchronousStateUpdatesCache: Boolean? = null
  private var enableViewCullingCache: Boolean? = null
  private var enableViewRecyclingCache: Boolean? = null
  private var enableViewRecyclingForTextCache: Boolean? = null
  private var enableViewRecyclingForViewCache: Boolean? = null
  private var enableVirtualViewDebugFeaturesCache: Boolean? = null
  private var enableVirtualViewRenderStateCache: Boolean? = null
  private var enableVirtualViewWindowFocusDetectionCache: Boolean? = null
  private var fixMappingOfEventPrioritiesBetweenFabricAndReactCache: Boolean? = null
  private var fuseboxEnabledReleaseCache: Boolean? = null
  private var fuseboxNetworkInspectionEnabledCache: Boolean? = null
  private var hideOffscreenVirtualViewsOnIOSCache: Boolean? = null
  private var preparedTextCacheSizeCache: Double? = null
  private var preventShadowTreeCommitExhaustionCache: Boolean? = null
  private var traceTurboModulePromiseRejectionsOnAndroidCache: Boolean? = null
  private var updateRuntimeShadowNodeReferencesOnCommitCache: Boolean? = null
  private var useAlwaysAvailableJSErrorHandlingCache: Boolean? = null
  private var useFabricInteropCache: Boolean? = null
  private var useNativeViewConfigsInBridgelessModeCache: Boolean? = null
  private var useOptimizedEventBatchingOnAndroidCache: Boolean? = null
  private var useRawPropsJsiValueCache: Boolean? = null
  private var useShadowNodeStateOnCloneCache: Boolean? = null
  private var useTurboModuleInteropCache: Boolean? = null
  private var useTurboModulesCache: Boolean? = null
  private var virtualViewPrerenderRatioCache: Double? = null

  override fun commonTestFlag(): Boolean {
    var cached = commonTestFlagCache
    if (cached == null) {
      cached = currentProvider.commonTestFlag()
      accessedFeatureFlags.add("commonTestFlag")
      commonTestFlagCache = cached
    }
    return cached
  }

  override fun animatedShouldSignalBatch(): Boolean {
    var cached = animatedShouldSignalBatchCache
    if (cached == null) {
      cached = currentProvider.animatedShouldSignalBatch()
      accessedFeatureFlags.add("animatedShouldSignalBatch")
      animatedShouldSignalBatchCache = cached
    }
    return cached
  }

  override fun cxxNativeAnimatedEnabled(): Boolean {
    var cached = cxxNativeAnimatedEnabledCache
    if (cached == null) {
      cached = currentProvider.cxxNativeAnimatedEnabled()
      accessedFeatureFlags.add("cxxNativeAnimatedEnabled")
      cxxNativeAnimatedEnabledCache = cached
    }
    return cached
  }

  override fun cxxNativeAnimatedRemoveJsSync(): Boolean {
    var cached = cxxNativeAnimatedRemoveJsSyncCache
    if (cached == null) {
      cached = currentProvider.cxxNativeAnimatedRemoveJsSync()
      accessedFeatureFlags.add("cxxNativeAnimatedRemoveJsSync")
      cxxNativeAnimatedRemoveJsSyncCache = cached
    }
    return cached
  }

  override fun disableMainQueueSyncDispatchIOS(): Boolean {
    var cached = disableMainQueueSyncDispatchIOSCache
    if (cached == null) {
      cached = currentProvider.disableMainQueueSyncDispatchIOS()
      accessedFeatureFlags.add("disableMainQueueSyncDispatchIOS")
      disableMainQueueSyncDispatchIOSCache = cached
    }
    return cached
  }

  override fun disableMountItemReorderingAndroid(): Boolean {
    var cached = disableMountItemReorderingAndroidCache
    if (cached == null) {
      cached = currentProvider.disableMountItemReorderingAndroid()
      accessedFeatureFlags.add("disableMountItemReorderingAndroid")
      disableMountItemReorderingAndroidCache = cached
    }
    return cached
  }

  override fun disableTextLayoutManagerCacheAndroid(): Boolean {
    var cached = disableTextLayoutManagerCacheAndroidCache
    if (cached == null) {
      cached = currentProvider.disableTextLayoutManagerCacheAndroid()
      accessedFeatureFlags.add("disableTextLayoutManagerCacheAndroid")
      disableTextLayoutManagerCacheAndroidCache = cached
    }
    return cached
  }

  override fun enableAccessibilityOrder(): Boolean {
    var cached = enableAccessibilityOrderCache
    if (cached == null) {
      cached = currentProvider.enableAccessibilityOrder()
      accessedFeatureFlags.add("enableAccessibilityOrder")
      enableAccessibilityOrderCache = cached
    }
    return cached
  }

  override fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean {
    var cached = enableAccumulatedUpdatesInRawPropsAndroidCache
    if (cached == null) {
      cached = currentProvider.enableAccumulatedUpdatesInRawPropsAndroid()
      accessedFeatureFlags.add("enableAccumulatedUpdatesInRawPropsAndroid")
      enableAccumulatedUpdatesInRawPropsAndroidCache = cached
    }
    return cached
  }

  override fun enableAndroidTextMeasurementOptimizations(): Boolean {
    var cached = enableAndroidTextMeasurementOptimizationsCache
    if (cached == null) {
      cached = currentProvider.enableAndroidTextMeasurementOptimizations()
      accessedFeatureFlags.add("enableAndroidTextMeasurementOptimizations")
      enableAndroidTextMeasurementOptimizationsCache = cached
    }
    return cached
  }

  override fun enableBridgelessArchitecture(): Boolean {
    var cached = enableBridgelessArchitectureCache
    if (cached == null) {
      cached = currentProvider.enableBridgelessArchitecture()
      accessedFeatureFlags.add("enableBridgelessArchitecture")
      enableBridgelessArchitectureCache = cached
    }
    return cached
  }

  override fun enableCppPropsIteratorSetter(): Boolean {
    var cached = enableCppPropsIteratorSetterCache
    if (cached == null) {
      cached = currentProvider.enableCppPropsIteratorSetter()
      accessedFeatureFlags.add("enableCppPropsIteratorSetter")
      enableCppPropsIteratorSetterCache = cached
    }
    return cached
  }

  override fun enableCustomFocusSearchOnClippedElementsAndroid(): Boolean {
    var cached = enableCustomFocusSearchOnClippedElementsAndroidCache
    if (cached == null) {
      cached = currentProvider.enableCustomFocusSearchOnClippedElementsAndroid()
      accessedFeatureFlags.add("enableCustomFocusSearchOnClippedElementsAndroid")
      enableCustomFocusSearchOnClippedElementsAndroidCache = cached
    }
    return cached
  }

  override fun enableDestroyShadowTreeRevisionAsync(): Boolean {
    var cached = enableDestroyShadowTreeRevisionAsyncCache
    if (cached == null) {
      cached = currentProvider.enableDestroyShadowTreeRevisionAsync()
      accessedFeatureFlags.add("enableDestroyShadowTreeRevisionAsync")
      enableDestroyShadowTreeRevisionAsyncCache = cached
    }
    return cached
  }

  override fun enableDoubleMeasurementFixAndroid(): Boolean {
    var cached = enableDoubleMeasurementFixAndroidCache
    if (cached == null) {
      cached = currentProvider.enableDoubleMeasurementFixAndroid()
      accessedFeatureFlags.add("enableDoubleMeasurementFixAndroid")
      enableDoubleMeasurementFixAndroidCache = cached
    }
    return cached
  }

  override fun enableEagerRootViewAttachment(): Boolean {
    var cached = enableEagerRootViewAttachmentCache
    if (cached == null) {
      cached = currentProvider.enableEagerRootViewAttachment()
      accessedFeatureFlags.add("enableEagerRootViewAttachment")
      enableEagerRootViewAttachmentCache = cached
    }
    return cached
  }

  override fun enableFabricLogs(): Boolean {
    var cached = enableFabricLogsCache
    if (cached == null) {
      cached = currentProvider.enableFabricLogs()
      accessedFeatureFlags.add("enableFabricLogs")
      enableFabricLogsCache = cached
    }
    return cached
  }

  override fun enableFabricRenderer(): Boolean {
    var cached = enableFabricRendererCache
    if (cached == null) {
      cached = currentProvider.enableFabricRenderer()
      accessedFeatureFlags.add("enableFabricRenderer")
      enableFabricRendererCache = cached
    }
    return cached
  }

  override fun enableFixForParentTagDuringReparenting(): Boolean {
    var cached = enableFixForParentTagDuringReparentingCache
    if (cached == null) {
      cached = currentProvider.enableFixForParentTagDuringReparenting()
      accessedFeatureFlags.add("enableFixForParentTagDuringReparenting")
      enableFixForParentTagDuringReparentingCache = cached
    }
    return cached
  }

  override fun enableFontScaleChangesUpdatingLayout(): Boolean {
    var cached = enableFontScaleChangesUpdatingLayoutCache
    if (cached == null) {
      cached = currentProvider.enableFontScaleChangesUpdatingLayout()
      accessedFeatureFlags.add("enableFontScaleChangesUpdatingLayout")
      enableFontScaleChangesUpdatingLayoutCache = cached
    }
    return cached
  }

  override fun enableIOSTextBaselineOffsetPerLine(): Boolean {
    var cached = enableIOSTextBaselineOffsetPerLineCache
    if (cached == null) {
      cached = currentProvider.enableIOSTextBaselineOffsetPerLine()
      accessedFeatureFlags.add("enableIOSTextBaselineOffsetPerLine")
      enableIOSTextBaselineOffsetPerLineCache = cached
    }
    return cached
  }

  override fun enableIOSViewClipToPaddingBox(): Boolean {
    var cached = enableIOSViewClipToPaddingBoxCache
    if (cached == null) {
      cached = currentProvider.enableIOSViewClipToPaddingBox()
      accessedFeatureFlags.add("enableIOSViewClipToPaddingBox")
      enableIOSViewClipToPaddingBoxCache = cached
    }
    return cached
  }

  override fun enableInteropViewManagerClassLookUpOptimizationIOS(): Boolean {
    var cached = enableInteropViewManagerClassLookUpOptimizationIOSCache
    if (cached == null) {
      cached = currentProvider.enableInteropViewManagerClassLookUpOptimizationIOS()
      accessedFeatureFlags.add("enableInteropViewManagerClassLookUpOptimizationIOS")
      enableInteropViewManagerClassLookUpOptimizationIOSCache = cached
    }
    return cached
  }

  override fun enableLayoutAnimationsOnAndroid(): Boolean {
    var cached = enableLayoutAnimationsOnAndroidCache
    if (cached == null) {
      cached = currentProvider.enableLayoutAnimationsOnAndroid()
      accessedFeatureFlags.add("enableLayoutAnimationsOnAndroid")
      enableLayoutAnimationsOnAndroidCache = cached
    }
    return cached
  }

  override fun enableLayoutAnimationsOnIOS(): Boolean {
    var cached = enableLayoutAnimationsOnIOSCache
    if (cached == null) {
      cached = currentProvider.enableLayoutAnimationsOnIOS()
      accessedFeatureFlags.add("enableLayoutAnimationsOnIOS")
      enableLayoutAnimationsOnIOSCache = cached
    }
    return cached
  }

  override fun enableMainQueueCoordinatorOnIOS(): Boolean {
    var cached = enableMainQueueCoordinatorOnIOSCache
    if (cached == null) {
      cached = currentProvider.enableMainQueueCoordinatorOnIOS()
      accessedFeatureFlags.add("enableMainQueueCoordinatorOnIOS")
      enableMainQueueCoordinatorOnIOSCache = cached
    }
    return cached
  }

  override fun enableMainQueueModulesOnIOS(): Boolean {
    var cached = enableMainQueueModulesOnIOSCache
    if (cached == null) {
      cached = currentProvider.enableMainQueueModulesOnIOS()
      accessedFeatureFlags.add("enableMainQueueModulesOnIOS")
      enableMainQueueModulesOnIOSCache = cached
    }
    return cached
  }

  override fun enableModuleArgumentNSNullConversionIOS(): Boolean {
    var cached = enableModuleArgumentNSNullConversionIOSCache
    if (cached == null) {
      cached = currentProvider.enableModuleArgumentNSNullConversionIOS()
      accessedFeatureFlags.add("enableModuleArgumentNSNullConversionIOS")
      enableModuleArgumentNSNullConversionIOSCache = cached
    }
    return cached
  }

  override fun enableNativeCSSParsing(): Boolean {
    var cached = enableNativeCSSParsingCache
    if (cached == null) {
      cached = currentProvider.enableNativeCSSParsing()
      accessedFeatureFlags.add("enableNativeCSSParsing")
      enableNativeCSSParsingCache = cached
    }
    return cached
  }

  override fun enableNetworkEventReporting(): Boolean {
    var cached = enableNetworkEventReportingCache
    if (cached == null) {
      cached = currentProvider.enableNetworkEventReporting()
      accessedFeatureFlags.add("enableNetworkEventReporting")
      enableNetworkEventReportingCache = cached
    }
    return cached
  }

  override fun enableNewBackgroundAndBorderDrawables(): Boolean {
    var cached = enableNewBackgroundAndBorderDrawablesCache
    if (cached == null) {
      cached = currentProvider.enableNewBackgroundAndBorderDrawables()
      accessedFeatureFlags.add("enableNewBackgroundAndBorderDrawables")
      enableNewBackgroundAndBorderDrawablesCache = cached
    }
    return cached
  }

  override fun enablePreparedTextLayout(): Boolean {
    var cached = enablePreparedTextLayoutCache
    if (cached == null) {
      cached = currentProvider.enablePreparedTextLayout()
      accessedFeatureFlags.add("enablePreparedTextLayout")
      enablePreparedTextLayoutCache = cached
    }
    return cached
  }

  override fun enablePropsUpdateReconciliationAndroid(): Boolean {
    var cached = enablePropsUpdateReconciliationAndroidCache
    if (cached == null) {
      cached = currentProvider.enablePropsUpdateReconciliationAndroid()
      accessedFeatureFlags.add("enablePropsUpdateReconciliationAndroid")
      enablePropsUpdateReconciliationAndroidCache = cached
    }
    return cached
  }

  override fun enableResourceTimingAPI(): Boolean {
    var cached = enableResourceTimingAPICache
    if (cached == null) {
      cached = currentProvider.enableResourceTimingAPI()
      accessedFeatureFlags.add("enableResourceTimingAPI")
      enableResourceTimingAPICache = cached
    }
    return cached
  }

  override fun enableSynchronousStateUpdates(): Boolean {
    var cached = enableSynchronousStateUpdatesCache
    if (cached == null) {
      cached = currentProvider.enableSynchronousStateUpdates()
      accessedFeatureFlags.add("enableSynchronousStateUpdates")
      enableSynchronousStateUpdatesCache = cached
    }
    return cached
  }

  override fun enableViewCulling(): Boolean {
    var cached = enableViewCullingCache
    if (cached == null) {
      cached = currentProvider.enableViewCulling()
      accessedFeatureFlags.add("enableViewCulling")
      enableViewCullingCache = cached
    }
    return cached
  }

  override fun enableViewRecycling(): Boolean {
    var cached = enableViewRecyclingCache
    if (cached == null) {
      cached = currentProvider.enableViewRecycling()
      accessedFeatureFlags.add("enableViewRecycling")
      enableViewRecyclingCache = cached
    }
    return cached
  }

  override fun enableViewRecyclingForText(): Boolean {
    var cached = enableViewRecyclingForTextCache
    if (cached == null) {
      cached = currentProvider.enableViewRecyclingForText()
      accessedFeatureFlags.add("enableViewRecyclingForText")
      enableViewRecyclingForTextCache = cached
    }
    return cached
  }

  override fun enableViewRecyclingForView(): Boolean {
    var cached = enableViewRecyclingForViewCache
    if (cached == null) {
      cached = currentProvider.enableViewRecyclingForView()
      accessedFeatureFlags.add("enableViewRecyclingForView")
      enableViewRecyclingForViewCache = cached
    }
    return cached
  }

  override fun enableVirtualViewDebugFeatures(): Boolean {
    var cached = enableVirtualViewDebugFeaturesCache
    if (cached == null) {
      cached = currentProvider.enableVirtualViewDebugFeatures()
      accessedFeatureFlags.add("enableVirtualViewDebugFeatures")
      enableVirtualViewDebugFeaturesCache = cached
    }
    return cached
  }

  override fun enableVirtualViewRenderState(): Boolean {
    var cached = enableVirtualViewRenderStateCache
    if (cached == null) {
      cached = currentProvider.enableVirtualViewRenderState()
      accessedFeatureFlags.add("enableVirtualViewRenderState")
      enableVirtualViewRenderStateCache = cached
    }
    return cached
  }

  override fun enableVirtualViewWindowFocusDetection(): Boolean {
    var cached = enableVirtualViewWindowFocusDetectionCache
    if (cached == null) {
      cached = currentProvider.enableVirtualViewWindowFocusDetection()
      accessedFeatureFlags.add("enableVirtualViewWindowFocusDetection")
      enableVirtualViewWindowFocusDetectionCache = cached
    }
    return cached
  }

  override fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean {
    var cached = fixMappingOfEventPrioritiesBetweenFabricAndReactCache
    if (cached == null) {
      cached = currentProvider.fixMappingOfEventPrioritiesBetweenFabricAndReact()
      accessedFeatureFlags.add("fixMappingOfEventPrioritiesBetweenFabricAndReact")
      fixMappingOfEventPrioritiesBetweenFabricAndReactCache = cached
    }
    return cached
  }

  override fun fuseboxEnabledRelease(): Boolean {
    var cached = fuseboxEnabledReleaseCache
    if (cached == null) {
      cached = currentProvider.fuseboxEnabledRelease()
      accessedFeatureFlags.add("fuseboxEnabledRelease")
      fuseboxEnabledReleaseCache = cached
    }
    return cached
  }

  override fun fuseboxNetworkInspectionEnabled(): Boolean {
    var cached = fuseboxNetworkInspectionEnabledCache
    if (cached == null) {
      cached = currentProvider.fuseboxNetworkInspectionEnabled()
      accessedFeatureFlags.add("fuseboxNetworkInspectionEnabled")
      fuseboxNetworkInspectionEnabledCache = cached
    }
    return cached
  }

  override fun hideOffscreenVirtualViewsOnIOS(): Boolean {
    var cached = hideOffscreenVirtualViewsOnIOSCache
    if (cached == null) {
      cached = currentProvider.hideOffscreenVirtualViewsOnIOS()
      accessedFeatureFlags.add("hideOffscreenVirtualViewsOnIOS")
      hideOffscreenVirtualViewsOnIOSCache = cached
    }
    return cached
  }

  override fun preparedTextCacheSize(): Double {
    var cached = preparedTextCacheSizeCache
    if (cached == null) {
      cached = currentProvider.preparedTextCacheSize()
      accessedFeatureFlags.add("preparedTextCacheSize")
      preparedTextCacheSizeCache = cached
    }
    return cached
  }

  override fun preventShadowTreeCommitExhaustion(): Boolean {
    var cached = preventShadowTreeCommitExhaustionCache
    if (cached == null) {
      cached = currentProvider.preventShadowTreeCommitExhaustion()
      accessedFeatureFlags.add("preventShadowTreeCommitExhaustion")
      preventShadowTreeCommitExhaustionCache = cached
    }
    return cached
  }

  override fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean {
    var cached = traceTurboModulePromiseRejectionsOnAndroidCache
    if (cached == null) {
      cached = currentProvider.traceTurboModulePromiseRejectionsOnAndroid()
      accessedFeatureFlags.add("traceTurboModulePromiseRejectionsOnAndroid")
      traceTurboModulePromiseRejectionsOnAndroidCache = cached
    }
    return cached
  }

  override fun updateRuntimeShadowNodeReferencesOnCommit(): Boolean {
    var cached = updateRuntimeShadowNodeReferencesOnCommitCache
    if (cached == null) {
      cached = currentProvider.updateRuntimeShadowNodeReferencesOnCommit()
      accessedFeatureFlags.add("updateRuntimeShadowNodeReferencesOnCommit")
      updateRuntimeShadowNodeReferencesOnCommitCache = cached
    }
    return cached
  }

  override fun useAlwaysAvailableJSErrorHandling(): Boolean {
    var cached = useAlwaysAvailableJSErrorHandlingCache
    if (cached == null) {
      cached = currentProvider.useAlwaysAvailableJSErrorHandling()
      accessedFeatureFlags.add("useAlwaysAvailableJSErrorHandling")
      useAlwaysAvailableJSErrorHandlingCache = cached
    }
    return cached
  }

  override fun useFabricInterop(): Boolean {
    var cached = useFabricInteropCache
    if (cached == null) {
      cached = currentProvider.useFabricInterop()
      accessedFeatureFlags.add("useFabricInterop")
      useFabricInteropCache = cached
    }
    return cached
  }

  override fun useNativeViewConfigsInBridgelessMode(): Boolean {
    var cached = useNativeViewConfigsInBridgelessModeCache
    if (cached == null) {
      cached = currentProvider.useNativeViewConfigsInBridgelessMode()
      accessedFeatureFlags.add("useNativeViewConfigsInBridgelessMode")
      useNativeViewConfigsInBridgelessModeCache = cached
    }
    return cached
  }

  override fun useOptimizedEventBatchingOnAndroid(): Boolean {
    var cached = useOptimizedEventBatchingOnAndroidCache
    if (cached == null) {
      cached = currentProvider.useOptimizedEventBatchingOnAndroid()
      accessedFeatureFlags.add("useOptimizedEventBatchingOnAndroid")
      useOptimizedEventBatchingOnAndroidCache = cached
    }
    return cached
  }

  override fun useRawPropsJsiValue(): Boolean {
    var cached = useRawPropsJsiValueCache
    if (cached == null) {
      cached = currentProvider.useRawPropsJsiValue()
      accessedFeatureFlags.add("useRawPropsJsiValue")
      useRawPropsJsiValueCache = cached
    }
    return cached
  }

  override fun useShadowNodeStateOnClone(): Boolean {
    var cached = useShadowNodeStateOnCloneCache
    if (cached == null) {
      cached = currentProvider.useShadowNodeStateOnClone()
      accessedFeatureFlags.add("useShadowNodeStateOnClone")
      useShadowNodeStateOnCloneCache = cached
    }
    return cached
  }

  override fun useTurboModuleInterop(): Boolean {
    var cached = useTurboModuleInteropCache
    if (cached == null) {
      cached = currentProvider.useTurboModuleInterop()
      accessedFeatureFlags.add("useTurboModuleInterop")
      useTurboModuleInteropCache = cached
    }
    return cached
  }

  override fun useTurboModules(): Boolean {
    var cached = useTurboModulesCache
    if (cached == null) {
      cached = currentProvider.useTurboModules()
      accessedFeatureFlags.add("useTurboModules")
      useTurboModulesCache = cached
    }
    return cached
  }

  override fun virtualViewPrerenderRatio(): Double {
    var cached = virtualViewPrerenderRatioCache
    if (cached == null) {
      cached = currentProvider.virtualViewPrerenderRatio()
      accessedFeatureFlags.add("virtualViewPrerenderRatio")
      virtualViewPrerenderRatioCache = cached
    }
    return cached
  }

  override fun override(provider: ReactNativeFeatureFlagsProvider) {
    if (accessedFeatureFlags.isNotEmpty()) {
      val accessedFeatureFlagsStr = accessedFeatureFlags.joinToString(separator = ", ") { it }
      throw IllegalStateException(
          "Feature flags were accessed before being overridden: $accessedFeatureFlagsStr")
    }
    currentProvider = provider
  }

  override fun dangerouslyReset() {
    // We don't need to do anything else here because `ReactNativeFeatureFlags` will just create a
    // new instance of this class.
  }

  override fun dangerouslyForceOverride(provider: ReactNativeFeatureFlagsProvider): String? {
    val accessedFeatureFlags = getAccessedFeatureFlags()
    currentProvider = provider
    return accessedFeatureFlags
  }

  internal fun getAccessedFeatureFlags(): String? {
    if (accessedFeatureFlags.isEmpty()) {
      return null
    }

    return accessedFeatureFlags.joinToString(separator = ", ") { it }
  }
}
