/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<2a0cd5a4875a54bb724e5765ffe7753e>>
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

public open class ReactNativeFeatureFlagsDefaults : ReactNativeFeatureFlagsProvider {
  // We could use JNI to get the defaults from C++,
  // but that is more expensive than just duplicating the defaults here.

  override fun commonTestFlag(): Boolean = false

  override fun allowRecursiveCommitsWithSynchronousMountOnAndroid(): Boolean = false

  override fun batchRenderingUpdatesInEventLoop(): Boolean = false

  override fun completeReactInstanceCreationOnBgThreadOnAndroid(): Boolean = false

  override fun destroyFabricSurfacesInReactInstanceManager(): Boolean = false

  override fun enableAlignItemsBaselineOnFabricIOS(): Boolean = true

  override fun enableAndroidMixBlendModeProp(): Boolean = false

  override fun enableBackgroundStyleApplicator(): Boolean = true

  override fun enableCleanTextInputYogaNode(): Boolean = false

  override fun enableEagerRootViewAttachment(): Boolean = false

  override fun enableEventEmitterRetentionDuringGesturesOnAndroid(): Boolean = false

  override fun enableFabricLogs(): Boolean = false

  override fun enableFabricRendererExclusively(): Boolean = false

  override fun enableGranularShadowTreeStateReconciliation(): Boolean = false

  override fun enableIOSViewClipToPaddingBox(): Boolean = false

  override fun enableLayoutAnimationsOnIOS(): Boolean = true

  override fun enableLongTaskAPI(): Boolean = false

  override fun enableMicrotasks(): Boolean = false

  override fun enablePropsUpdateReconciliationAndroid(): Boolean = false

  override fun enableReportEventPaintTime(): Boolean = false

  override fun enableSynchronousStateUpdates(): Boolean = false

  override fun enableUIConsistency(): Boolean = false

  override fun enableViewRecycling(): Boolean = false

  override fun excludeYogaFromRawProps(): Boolean = false

  override fun fetchImagesInViewPreallocation(): Boolean = false

  override fun fixIncorrectScrollViewStateUpdateOnAndroid(): Boolean = false

  override fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean = false

  override fun fixMissedFabricStateUpdatesOnAndroid(): Boolean = false

  override fun fixMountingCoordinatorReportedPendingTransactionsOnAndroid(): Boolean = false

  override fun forceBatchingMountItemsOnAndroid(): Boolean = false

  override fun fuseboxEnabledDebug(): Boolean = true

  override fun fuseboxEnabledRelease(): Boolean = false

  override fun initEagerTurboModulesOnNativeModulesQueueAndroid(): Boolean = false

  override fun lazyAnimationCallbacks(): Boolean = false

  override fun loadVectorDrawablesOnImages(): Boolean = false

  override fun setAndroidLayoutDirection(): Boolean = false

  override fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean = false

  override fun useFabricInterop(): Boolean = false

  override fun useImmediateExecutorInAndroidBridgeless(): Boolean = false

  override fun useModernRuntimeScheduler(): Boolean = false

  override fun useNativeViewConfigsInBridgelessMode(): Boolean = false

  override fun useNewReactImageViewBackgroundDrawing(): Boolean = false

  override fun useOptimisedViewPreallocationOnAndroid(): Boolean = false

  override fun useOptimizedEventBatchingOnAndroid(): Boolean = false

  override fun useRuntimeShadowNodeReferenceUpdate(): Boolean = false

  override fun useRuntimeShadowNodeReferenceUpdateOnLayout(): Boolean = false

  override fun useStateAlignmentMechanism(): Boolean = false

  override fun useTurboModuleInterop(): Boolean = false
}
