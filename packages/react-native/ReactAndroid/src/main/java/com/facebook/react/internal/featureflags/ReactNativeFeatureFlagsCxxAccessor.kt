/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<497bbb23778fe0f9763e9bfa715ea3aa>>
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

public class ReactNativeFeatureFlagsCxxAccessor : ReactNativeFeatureFlagsAccessor {
  private var commonTestFlagCache: Boolean? = null
  private var completeReactInstanceCreationOnBgThreadOnAndroidCache: Boolean? = null
  private var disableEventLoopOnBridgelessCache: Boolean? = null
  private var disableMountItemReorderingAndroidCache: Boolean? = null
  private var enableAccumulatedUpdatesInRawPropsAndroidCache: Boolean? = null
  private var enableBridgelessArchitectureCache: Boolean? = null
  private var enableCppPropsIteratorSetterCache: Boolean? = null
  private var enableDeletionOfUnmountedViewsCache: Boolean? = null
  private var enableEagerRootViewAttachmentCache: Boolean? = null
  private var enableEventEmitterRetentionDuringGesturesOnAndroidCache: Boolean? = null
  private var enableFabricLogsCache: Boolean? = null
  private var enableFabricRendererCache: Boolean? = null
  private var enableFixForViewCommandRaceCache: Boolean? = null
  private var enableGranularShadowTreeStateReconciliationCache: Boolean? = null
  private var enableIOSViewClipToPaddingBoxCache: Boolean? = null
  private var enableImagePrefetchingAndroidCache: Boolean? = null
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
  private var fixDifferentiatorEmittingUpdatesWithWrongParentTagCache: Boolean? = null
  private var fixMappingOfEventPrioritiesBetweenFabricAndReactCache: Boolean? = null
  private var fixMountingCoordinatorReportedPendingTransactionsOnAndroidCache: Boolean? = null
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
  private var useRawPropsJsiValueCache: Boolean? = null
  private var useRuntimeShadowNodeReferenceUpdateCache: Boolean? = null
  private var useTurboModuleInteropCache: Boolean? = null
  private var useTurboModulesCache: Boolean? = null

  override fun commonTestFlag(): Boolean {
    var cached = commonTestFlagCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.commonTestFlag()
      commonTestFlagCache = cached
    }
    return cached
  }

  override fun completeReactInstanceCreationOnBgThreadOnAndroid(): Boolean {
    var cached = completeReactInstanceCreationOnBgThreadOnAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.completeReactInstanceCreationOnBgThreadOnAndroid()
      completeReactInstanceCreationOnBgThreadOnAndroidCache = cached
    }
    return cached
  }

  override fun disableEventLoopOnBridgeless(): Boolean {
    var cached = disableEventLoopOnBridgelessCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.disableEventLoopOnBridgeless()
      disableEventLoopOnBridgelessCache = cached
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

  override fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean {
    var cached = enableAccumulatedUpdatesInRawPropsAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableAccumulatedUpdatesInRawPropsAndroid()
      enableAccumulatedUpdatesInRawPropsAndroidCache = cached
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

  override fun enableDeletionOfUnmountedViews(): Boolean {
    var cached = enableDeletionOfUnmountedViewsCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableDeletionOfUnmountedViews()
      enableDeletionOfUnmountedViewsCache = cached
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

  override fun enableEventEmitterRetentionDuringGesturesOnAndroid(): Boolean {
    var cached = enableEventEmitterRetentionDuringGesturesOnAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableEventEmitterRetentionDuringGesturesOnAndroid()
      enableEventEmitterRetentionDuringGesturesOnAndroidCache = cached
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

  override fun enableFixForViewCommandRace(): Boolean {
    var cached = enableFixForViewCommandRaceCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableFixForViewCommandRace()
      enableFixForViewCommandRaceCache = cached
    }
    return cached
  }

  override fun enableGranularShadowTreeStateReconciliation(): Boolean {
    var cached = enableGranularShadowTreeStateReconciliationCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableGranularShadowTreeStateReconciliation()
      enableGranularShadowTreeStateReconciliationCache = cached
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

  override fun enableLongTaskAPI(): Boolean {
    var cached = enableLongTaskAPICache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableLongTaskAPI()
      enableLongTaskAPICache = cached
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

  override fun enablePreciseSchedulingForPremountItemsOnAndroid(): Boolean {
    var cached = enablePreciseSchedulingForPremountItemsOnAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enablePreciseSchedulingForPremountItemsOnAndroid()
      enablePreciseSchedulingForPremountItemsOnAndroidCache = cached
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

  override fun enableReportEventPaintTime(): Boolean {
    var cached = enableReportEventPaintTimeCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableReportEventPaintTime()
      enableReportEventPaintTimeCache = cached
    }
    return cached
  }

  override fun enableSynchronousStateUpdates(): Boolean {
    var cached = enableSynchronousStateUpdatesCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableSynchronousStateUpdates()
      enableSynchronousStateUpdatesCache = cached
    }
    return cached
  }

  override fun enableUIConsistency(): Boolean {
    var cached = enableUIConsistencyCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableUIConsistency()
      enableUIConsistencyCache = cached
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

  override fun excludeYogaFromRawProps(): Boolean {
    var cached = excludeYogaFromRawPropsCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.excludeYogaFromRawProps()
      excludeYogaFromRawPropsCache = cached
    }
    return cached
  }

  override fun fixDifferentiatorEmittingUpdatesWithWrongParentTag(): Boolean {
    var cached = fixDifferentiatorEmittingUpdatesWithWrongParentTagCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.fixDifferentiatorEmittingUpdatesWithWrongParentTag()
      fixDifferentiatorEmittingUpdatesWithWrongParentTagCache = cached
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

  override fun fixMountingCoordinatorReportedPendingTransactionsOnAndroid(): Boolean {
    var cached = fixMountingCoordinatorReportedPendingTransactionsOnAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.fixMountingCoordinatorReportedPendingTransactionsOnAndroid()
      fixMountingCoordinatorReportedPendingTransactionsOnAndroidCache = cached
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

  override fun initEagerTurboModulesOnNativeModulesQueueAndroid(): Boolean {
    var cached = initEagerTurboModulesOnNativeModulesQueueAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.initEagerTurboModulesOnNativeModulesQueueAndroid()
      initEagerTurboModulesOnNativeModulesQueueAndroidCache = cached
    }
    return cached
  }

  override fun lazyAnimationCallbacks(): Boolean {
    var cached = lazyAnimationCallbacksCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.lazyAnimationCallbacks()
      lazyAnimationCallbacksCache = cached
    }
    return cached
  }

  override fun loadVectorDrawablesOnImages(): Boolean {
    var cached = loadVectorDrawablesOnImagesCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.loadVectorDrawablesOnImages()
      loadVectorDrawablesOnImagesCache = cached
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

  override fun useImmediateExecutorInAndroidBridgeless(): Boolean {
    var cached = useImmediateExecutorInAndroidBridgelessCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useImmediateExecutorInAndroidBridgeless()
      useImmediateExecutorInAndroidBridgelessCache = cached
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

  override fun useOptimisedViewPreallocationOnAndroid(): Boolean {
    var cached = useOptimisedViewPreallocationOnAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useOptimisedViewPreallocationOnAndroid()
      useOptimisedViewPreallocationOnAndroidCache = cached
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

  override fun useRuntimeShadowNodeReferenceUpdate(): Boolean {
    var cached = useRuntimeShadowNodeReferenceUpdateCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useRuntimeShadowNodeReferenceUpdate()
      useRuntimeShadowNodeReferenceUpdateCache = cached
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

  override fun override(provider: ReactNativeFeatureFlagsProvider): Unit =
      ReactNativeFeatureFlagsCxxInterop.override(provider as Any)

  override fun dangerouslyReset(): Unit = ReactNativeFeatureFlagsCxxInterop.dangerouslyReset()

  override fun dangerouslyForceOverride(provider: ReactNativeFeatureFlagsProvider): String? =
      ReactNativeFeatureFlagsCxxInterop.dangerouslyForceOverride(provider as Any)
}
