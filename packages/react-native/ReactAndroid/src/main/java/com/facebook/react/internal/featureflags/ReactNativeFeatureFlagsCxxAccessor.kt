/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<eca842a1b1c823b72136c625b3bfd16e>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

package com.facebook.react.internal.featureflags

public class ReactNativeFeatureFlagsCxxAccessor : ReactNativeFeatureFlagsAccessor {
  private var commonTestFlagCache: Boolean? = null
  private var allowRecursiveCommitsWithSynchronousMountOnAndroidCache: Boolean? = null
  private var batchRenderingUpdatesInEventLoopCache: Boolean? = null
  private var completeReactInstanceCreationOnBgThreadOnAndroidCache: Boolean? = null
  private var destroyFabricSurfacesInReactInstanceManagerCache: Boolean? = null
  private var enableAlignItemsBaselineOnFabricIOSCache: Boolean? = null
  private var enableAndroidMixBlendModePropCache: Boolean? = null
  private var enableBackgroundStyleApplicatorCache: Boolean? = null
  private var enableCleanTextInputYogaNodeCache: Boolean? = null
  private var enableEagerRootViewAttachmentCache: Boolean? = null
  private var enableEventEmitterRetentionDuringGesturesOnAndroidCache: Boolean? = null
  private var enableFabricLogsCache: Boolean? = null
  private var enableFabricRendererExclusivelyCache: Boolean? = null
  private var enableGranularShadowTreeStateReconciliationCache: Boolean? = null
  private var enableIOSViewClipToPaddingBoxCache: Boolean? = null
  private var enableLayoutAnimationsOnIOSCache: Boolean? = null
  private var enableLongTaskAPICache: Boolean? = null
  private var enableMicrotasksCache: Boolean? = null
  private var enablePropsUpdateReconciliationAndroidCache: Boolean? = null
  private var enableReportEventPaintTimeCache: Boolean? = null
  private var enableSynchronousStateUpdatesCache: Boolean? = null
  private var enableUIConsistencyCache: Boolean? = null
  private var enableViewRecyclingCache: Boolean? = null
  private var excludeYogaFromRawPropsCache: Boolean? = null
  private var fetchImagesInViewPreallocationCache: Boolean? = null
  private var fixIncorrectScrollViewStateUpdateOnAndroidCache: Boolean? = null
  private var fixMappingOfEventPrioritiesBetweenFabricAndReactCache: Boolean? = null
  private var fixMissedFabricStateUpdatesOnAndroidCache: Boolean? = null
  private var fixMountingCoordinatorReportedPendingTransactionsOnAndroidCache: Boolean? = null
  private var forceBatchingMountItemsOnAndroidCache: Boolean? = null
  private var fuseboxEnabledDebugCache: Boolean? = null
  private var fuseboxEnabledReleaseCache: Boolean? = null
  private var initEagerTurboModulesOnNativeModulesQueueAndroidCache: Boolean? = null
  private var lazyAnimationCallbacksCache: Boolean? = null
  private var loadVectorDrawablesOnImagesCache: Boolean? = null
  private var setAndroidLayoutDirectionCache: Boolean? = null
  private var traceTurboModulePromiseRejectionsOnAndroidCache: Boolean? = null
  private var useFabricInteropCache: Boolean? = null
  private var useImmediateExecutorInAndroidBridgelessCache: Boolean? = null
  private var useModernRuntimeSchedulerCache: Boolean? = null
  private var useNativeViewConfigsInBridgelessModeCache: Boolean? = null
  private var useNewReactImageViewBackgroundDrawingCache: Boolean? = null
  private var useOptimisedViewPreallocationOnAndroidCache: Boolean? = null
  private var useOptimizedEventBatchingOnAndroidCache: Boolean? = null
  private var useRuntimeShadowNodeReferenceUpdateCache: Boolean? = null
  private var useRuntimeShadowNodeReferenceUpdateOnLayoutCache: Boolean? = null
  private var useStateAlignmentMechanismCache: Boolean? = null
  private var useTurboModuleInteropCache: Boolean? = null

  override fun commonTestFlag(): Boolean {
    var cached = commonTestFlagCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.commonTestFlag()
      commonTestFlagCache = cached
    }
    return cached
  }

  override fun allowRecursiveCommitsWithSynchronousMountOnAndroid(): Boolean {
    var cached = allowRecursiveCommitsWithSynchronousMountOnAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.allowRecursiveCommitsWithSynchronousMountOnAndroid()
      allowRecursiveCommitsWithSynchronousMountOnAndroidCache = cached
    }
    return cached
  }

  override fun batchRenderingUpdatesInEventLoop(): Boolean {
    var cached = batchRenderingUpdatesInEventLoopCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.batchRenderingUpdatesInEventLoop()
      batchRenderingUpdatesInEventLoopCache = cached
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

  override fun destroyFabricSurfacesInReactInstanceManager(): Boolean {
    var cached = destroyFabricSurfacesInReactInstanceManagerCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.destroyFabricSurfacesInReactInstanceManager()
      destroyFabricSurfacesInReactInstanceManagerCache = cached
    }
    return cached
  }

  override fun enableAlignItemsBaselineOnFabricIOS(): Boolean {
    var cached = enableAlignItemsBaselineOnFabricIOSCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableAlignItemsBaselineOnFabricIOS()
      enableAlignItemsBaselineOnFabricIOSCache = cached
    }
    return cached
  }

  override fun enableAndroidMixBlendModeProp(): Boolean {
    var cached = enableAndroidMixBlendModePropCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableAndroidMixBlendModeProp()
      enableAndroidMixBlendModePropCache = cached
    }
    return cached
  }

  override fun enableBackgroundStyleApplicator(): Boolean {
    var cached = enableBackgroundStyleApplicatorCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableBackgroundStyleApplicator()
      enableBackgroundStyleApplicatorCache = cached
    }
    return cached
  }

  override fun enableCleanTextInputYogaNode(): Boolean {
    var cached = enableCleanTextInputYogaNodeCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableCleanTextInputYogaNode()
      enableCleanTextInputYogaNodeCache = cached
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

  override fun enableFabricRendererExclusively(): Boolean {
    var cached = enableFabricRendererExclusivelyCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableFabricRendererExclusively()
      enableFabricRendererExclusivelyCache = cached
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

  override fun enableMicrotasks(): Boolean {
    var cached = enableMicrotasksCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableMicrotasks()
      enableMicrotasksCache = cached
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

  override fun fetchImagesInViewPreallocation(): Boolean {
    var cached = fetchImagesInViewPreallocationCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.fetchImagesInViewPreallocation()
      fetchImagesInViewPreallocationCache = cached
    }
    return cached
  }

  override fun fixIncorrectScrollViewStateUpdateOnAndroid(): Boolean {
    var cached = fixIncorrectScrollViewStateUpdateOnAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.fixIncorrectScrollViewStateUpdateOnAndroid()
      fixIncorrectScrollViewStateUpdateOnAndroidCache = cached
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

  override fun fixMissedFabricStateUpdatesOnAndroid(): Boolean {
    var cached = fixMissedFabricStateUpdatesOnAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.fixMissedFabricStateUpdatesOnAndroid()
      fixMissedFabricStateUpdatesOnAndroidCache = cached
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

  override fun forceBatchingMountItemsOnAndroid(): Boolean {
    var cached = forceBatchingMountItemsOnAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.forceBatchingMountItemsOnAndroid()
      forceBatchingMountItemsOnAndroidCache = cached
    }
    return cached
  }

  override fun fuseboxEnabledDebug(): Boolean {
    var cached = fuseboxEnabledDebugCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.fuseboxEnabledDebug()
      fuseboxEnabledDebugCache = cached
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

  override fun setAndroidLayoutDirection(): Boolean {
    var cached = setAndroidLayoutDirectionCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.setAndroidLayoutDirection()
      setAndroidLayoutDirectionCache = cached
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

  override fun useModernRuntimeScheduler(): Boolean {
    var cached = useModernRuntimeSchedulerCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useModernRuntimeScheduler()
      useModernRuntimeSchedulerCache = cached
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

  override fun useNewReactImageViewBackgroundDrawing(): Boolean {
    var cached = useNewReactImageViewBackgroundDrawingCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useNewReactImageViewBackgroundDrawing()
      useNewReactImageViewBackgroundDrawingCache = cached
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

  override fun useRuntimeShadowNodeReferenceUpdate(): Boolean {
    var cached = useRuntimeShadowNodeReferenceUpdateCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useRuntimeShadowNodeReferenceUpdate()
      useRuntimeShadowNodeReferenceUpdateCache = cached
    }
    return cached
  }

  override fun useRuntimeShadowNodeReferenceUpdateOnLayout(): Boolean {
    var cached = useRuntimeShadowNodeReferenceUpdateOnLayoutCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useRuntimeShadowNodeReferenceUpdateOnLayout()
      useRuntimeShadowNodeReferenceUpdateOnLayoutCache = cached
    }
    return cached
  }

  override fun useStateAlignmentMechanism(): Boolean {
    var cached = useStateAlignmentMechanismCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useStateAlignmentMechanism()
      useStateAlignmentMechanismCache = cached
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

  override fun override(provider: ReactNativeFeatureFlagsProvider): Unit =
      ReactNativeFeatureFlagsCxxInterop.override(provider as Any)

  override fun dangerouslyReset(): Unit = ReactNativeFeatureFlagsCxxInterop.dangerouslyReset()
}
