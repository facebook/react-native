/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<4bb5173b9ba1d3e620f3a7d613b27ac7>>
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

public class ReactNativeFeatureFlagsLocalAccessor : ReactNativeFeatureFlagsAccessor {
  private var currentProvider: ReactNativeFeatureFlagsProvider = ReactNativeFeatureFlagsDefaults()

  private val accessedFeatureFlags = mutableSetOf<String>()

  private var commonTestFlagCache: Boolean? = null
  private var completeReactInstanceCreationOnBgThreadOnAndroidCache: Boolean? = null
  private var disableEventLoopOnBridgelessCache: Boolean? = null
  private var disableMountItemReorderingAndroidCache: Boolean? = null
  private var enableAlignItemsBaselineOnFabricIOSCache: Boolean? = null
  private var enableAndroidLineHeightCenteringCache: Boolean? = null
  private var enableBridgelessArchitectureCache: Boolean? = null
  private var enableCppPropsIteratorSetterCache: Boolean? = null
  private var enableDeletionOfUnmountedViewsCache: Boolean? = null
  private var enableEagerRootViewAttachmentCache: Boolean? = null
  private var enableEventEmitterRetentionDuringGesturesOnAndroidCache: Boolean? = null
  private var enableFabricLogsCache: Boolean? = null
  private var enableFabricRendererCache: Boolean? = null
  private var enableFabricRendererExclusivelyCache: Boolean? = null
  private var enableFixForViewCommandRaceCache: Boolean? = null
  private var enableGranularShadowTreeStateReconciliationCache: Boolean? = null
  private var enableIOSViewClipToPaddingBoxCache: Boolean? = null
  private var enableLayoutAnimationsOnAndroidCache: Boolean? = null
  private var enableLayoutAnimationsOnIOSCache: Boolean? = null
  private var enableLongTaskAPICache: Boolean? = null
  private var enableNewBackgroundAndBorderDrawablesCache: Boolean? = null
  private var enablePreciseSchedulingForPremountItemsOnAndroidCache: Boolean? = null
  private var enablePropsUpdateReconciliationAndroidCache: Boolean? = null
  private var enableReportEventPaintTimeCache: Boolean? = null
  private var enableSynchronousStateUpdatesCache: Boolean? = null
  private var enableUIConsistencyCache: Boolean? = null
  private var enableViewRecyclingCache: Boolean? = null
  private var excludeYogaFromRawPropsCache: Boolean? = null
  private var fixMappingOfEventPrioritiesBetweenFabricAndReactCache: Boolean? = null
  private var fixMountingCoordinatorReportedPendingTransactionsOnAndroidCache: Boolean? = null
  private var fuseboxEnabledDebugCache: Boolean? = null
  private var fuseboxEnabledReleaseCache: Boolean? = null
  private var initEagerTurboModulesOnNativeModulesQueueAndroidCache: Boolean? = null
  private var lazyAnimationCallbacksCache: Boolean? = null
  private var loadVectorDrawablesOnImagesCache: Boolean? = null
  private var traceTurboModulePromiseRejectionsOnAndroidCache: Boolean? = null
  private var useAlwaysAvailableJSErrorHandlingCache: Boolean? = null
  private var useFabricInteropCache: Boolean? = null
  private var useImmediateExecutorInAndroidBridgelessCache: Boolean? = null
  private var useNativeViewConfigsInBridgelessModeCache: Boolean? = null
  private var useOptimisedViewPreallocationOnAndroidCache: Boolean? = null
  private var useOptimizedEventBatchingOnAndroidCache: Boolean? = null
  private var useRuntimeShadowNodeReferenceUpdateCache: Boolean? = null
  private var useTurboModuleInteropCache: Boolean? = null
  private var useTurboModulesCache: Boolean? = null

  override fun commonTestFlag(): Boolean {
    var cached = commonTestFlagCache
    if (cached == null) {
      cached = currentProvider.commonTestFlag()
      accessedFeatureFlags.add("commonTestFlag")
      commonTestFlagCache = cached
    }
    return cached
  }

  override fun completeReactInstanceCreationOnBgThreadOnAndroid(): Boolean {
    var cached = completeReactInstanceCreationOnBgThreadOnAndroidCache
    if (cached == null) {
      cached = currentProvider.completeReactInstanceCreationOnBgThreadOnAndroid()
      accessedFeatureFlags.add("completeReactInstanceCreationOnBgThreadOnAndroid")
      completeReactInstanceCreationOnBgThreadOnAndroidCache = cached
    }
    return cached
  }

  override fun disableEventLoopOnBridgeless(): Boolean {
    var cached = disableEventLoopOnBridgelessCache
    if (cached == null) {
      cached = currentProvider.disableEventLoopOnBridgeless()
      accessedFeatureFlags.add("disableEventLoopOnBridgeless")
      disableEventLoopOnBridgelessCache = cached
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

  override fun enableAlignItemsBaselineOnFabricIOS(): Boolean {
    var cached = enableAlignItemsBaselineOnFabricIOSCache
    if (cached == null) {
      cached = currentProvider.enableAlignItemsBaselineOnFabricIOS()
      accessedFeatureFlags.add("enableAlignItemsBaselineOnFabricIOS")
      enableAlignItemsBaselineOnFabricIOSCache = cached
    }
    return cached
  }

  override fun enableAndroidLineHeightCentering(): Boolean {
    var cached = enableAndroidLineHeightCenteringCache
    if (cached == null) {
      cached = currentProvider.enableAndroidLineHeightCentering()
      accessedFeatureFlags.add("enableAndroidLineHeightCentering")
      enableAndroidLineHeightCenteringCache = cached
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

  override fun enableDeletionOfUnmountedViews(): Boolean {
    var cached = enableDeletionOfUnmountedViewsCache
    if (cached == null) {
      cached = currentProvider.enableDeletionOfUnmountedViews()
      accessedFeatureFlags.add("enableDeletionOfUnmountedViews")
      enableDeletionOfUnmountedViewsCache = cached
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

  override fun enableEventEmitterRetentionDuringGesturesOnAndroid(): Boolean {
    var cached = enableEventEmitterRetentionDuringGesturesOnAndroidCache
    if (cached == null) {
      cached = currentProvider.enableEventEmitterRetentionDuringGesturesOnAndroid()
      accessedFeatureFlags.add("enableEventEmitterRetentionDuringGesturesOnAndroid")
      enableEventEmitterRetentionDuringGesturesOnAndroidCache = cached
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

  override fun enableFabricRendererExclusively(): Boolean {
    var cached = enableFabricRendererExclusivelyCache
    if (cached == null) {
      cached = currentProvider.enableFabricRendererExclusively()
      accessedFeatureFlags.add("enableFabricRendererExclusively")
      enableFabricRendererExclusivelyCache = cached
    }
    return cached
  }

  override fun enableFixForViewCommandRace(): Boolean {
    var cached = enableFixForViewCommandRaceCache
    if (cached == null) {
      cached = currentProvider.enableFixForViewCommandRace()
      accessedFeatureFlags.add("enableFixForViewCommandRace")
      enableFixForViewCommandRaceCache = cached
    }
    return cached
  }

  override fun enableGranularShadowTreeStateReconciliation(): Boolean {
    var cached = enableGranularShadowTreeStateReconciliationCache
    if (cached == null) {
      cached = currentProvider.enableGranularShadowTreeStateReconciliation()
      accessedFeatureFlags.add("enableGranularShadowTreeStateReconciliation")
      enableGranularShadowTreeStateReconciliationCache = cached
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

  override fun enableLongTaskAPI(): Boolean {
    var cached = enableLongTaskAPICache
    if (cached == null) {
      cached = currentProvider.enableLongTaskAPI()
      accessedFeatureFlags.add("enableLongTaskAPI")
      enableLongTaskAPICache = cached
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

  override fun enablePreciseSchedulingForPremountItemsOnAndroid(): Boolean {
    var cached = enablePreciseSchedulingForPremountItemsOnAndroidCache
    if (cached == null) {
      cached = currentProvider.enablePreciseSchedulingForPremountItemsOnAndroid()
      accessedFeatureFlags.add("enablePreciseSchedulingForPremountItemsOnAndroid")
      enablePreciseSchedulingForPremountItemsOnAndroidCache = cached
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

  override fun enableReportEventPaintTime(): Boolean {
    var cached = enableReportEventPaintTimeCache
    if (cached == null) {
      cached = currentProvider.enableReportEventPaintTime()
      accessedFeatureFlags.add("enableReportEventPaintTime")
      enableReportEventPaintTimeCache = cached
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

  override fun enableUIConsistency(): Boolean {
    var cached = enableUIConsistencyCache
    if (cached == null) {
      cached = currentProvider.enableUIConsistency()
      accessedFeatureFlags.add("enableUIConsistency")
      enableUIConsistencyCache = cached
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

  override fun excludeYogaFromRawProps(): Boolean {
    var cached = excludeYogaFromRawPropsCache
    if (cached == null) {
      cached = currentProvider.excludeYogaFromRawProps()
      accessedFeatureFlags.add("excludeYogaFromRawProps")
      excludeYogaFromRawPropsCache = cached
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

  override fun fixMountingCoordinatorReportedPendingTransactionsOnAndroid(): Boolean {
    var cached = fixMountingCoordinatorReportedPendingTransactionsOnAndroidCache
    if (cached == null) {
      cached = currentProvider.fixMountingCoordinatorReportedPendingTransactionsOnAndroid()
      accessedFeatureFlags.add("fixMountingCoordinatorReportedPendingTransactionsOnAndroid")
      fixMountingCoordinatorReportedPendingTransactionsOnAndroidCache = cached
    }
    return cached
  }

  override fun fuseboxEnabledDebug(): Boolean {
    var cached = fuseboxEnabledDebugCache
    if (cached == null) {
      cached = currentProvider.fuseboxEnabledDebug()
      accessedFeatureFlags.add("fuseboxEnabledDebug")
      fuseboxEnabledDebugCache = cached
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

  override fun initEagerTurboModulesOnNativeModulesQueueAndroid(): Boolean {
    var cached = initEagerTurboModulesOnNativeModulesQueueAndroidCache
    if (cached == null) {
      cached = currentProvider.initEagerTurboModulesOnNativeModulesQueueAndroid()
      accessedFeatureFlags.add("initEagerTurboModulesOnNativeModulesQueueAndroid")
      initEagerTurboModulesOnNativeModulesQueueAndroidCache = cached
    }
    return cached
  }

  override fun lazyAnimationCallbacks(): Boolean {
    var cached = lazyAnimationCallbacksCache
    if (cached == null) {
      cached = currentProvider.lazyAnimationCallbacks()
      accessedFeatureFlags.add("lazyAnimationCallbacks")
      lazyAnimationCallbacksCache = cached
    }
    return cached
  }

  override fun loadVectorDrawablesOnImages(): Boolean {
    var cached = loadVectorDrawablesOnImagesCache
    if (cached == null) {
      cached = currentProvider.loadVectorDrawablesOnImages()
      accessedFeatureFlags.add("loadVectorDrawablesOnImages")
      loadVectorDrawablesOnImagesCache = cached
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

  override fun useImmediateExecutorInAndroidBridgeless(): Boolean {
    var cached = useImmediateExecutorInAndroidBridgelessCache
    if (cached == null) {
      cached = currentProvider.useImmediateExecutorInAndroidBridgeless()
      accessedFeatureFlags.add("useImmediateExecutorInAndroidBridgeless")
      useImmediateExecutorInAndroidBridgelessCache = cached
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

  override fun useOptimisedViewPreallocationOnAndroid(): Boolean {
    var cached = useOptimisedViewPreallocationOnAndroidCache
    if (cached == null) {
      cached = currentProvider.useOptimisedViewPreallocationOnAndroid()
      accessedFeatureFlags.add("useOptimisedViewPreallocationOnAndroid")
      useOptimisedViewPreallocationOnAndroidCache = cached
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

  override fun useRuntimeShadowNodeReferenceUpdate(): Boolean {
    var cached = useRuntimeShadowNodeReferenceUpdateCache
    if (cached == null) {
      cached = currentProvider.useRuntimeShadowNodeReferenceUpdate()
      accessedFeatureFlags.add("useRuntimeShadowNodeReferenceUpdate")
      useRuntimeShadowNodeReferenceUpdateCache = cached
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
