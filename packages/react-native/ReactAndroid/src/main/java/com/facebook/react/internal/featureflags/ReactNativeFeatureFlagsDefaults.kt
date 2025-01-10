/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<5de2cfc00f486b7d07266939ce18a397>>
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

  override fun completeReactInstanceCreationOnBgThreadOnAndroid(): Boolean = true

  override fun disableEventLoopOnBridgeless(): Boolean = false

  override fun disableMountItemReorderingAndroid(): Boolean = false

  override fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean = false

  override fun enableBridgelessArchitecture(): Boolean = false

  override fun enableCppPropsIteratorSetter(): Boolean = false

  override fun enableDeletionOfUnmountedViews(): Boolean = false

  override fun enableEagerRootViewAttachment(): Boolean = false

  override fun enableEventEmitterRetentionDuringGesturesOnAndroid(): Boolean = false

  override fun enableFabricLogs(): Boolean = false

  override fun enableFabricRenderer(): Boolean = false

  override fun enableFixForViewCommandRace(): Boolean = false

  override fun enableGranularShadowTreeStateReconciliation(): Boolean = false

  override fun enableIOSViewClipToPaddingBox(): Boolean = false

  override fun enableImagePrefetchingAndroid(): Boolean = false

  override fun enableLayoutAnimationsOnAndroid(): Boolean = false

  override fun enableLayoutAnimationsOnIOS(): Boolean = true

  override fun enableLongTaskAPI(): Boolean = false

  override fun enableNewBackgroundAndBorderDrawables(): Boolean = false

  override fun enablePreciseSchedulingForPremountItemsOnAndroid(): Boolean = false

  override fun enablePropsUpdateReconciliationAndroid(): Boolean = false

  override fun enableReportEventPaintTime(): Boolean = false

  override fun enableSynchronousStateUpdates(): Boolean = false

  override fun enableUIConsistency(): Boolean = false

  override fun enableViewRecycling(): Boolean = false

  override fun excludeYogaFromRawProps(): Boolean = false

  override fun fixDifferentiatorEmittingUpdatesWithWrongParentTag(): Boolean = true

  override fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean = false

  override fun fixMountingCoordinatorReportedPendingTransactionsOnAndroid(): Boolean = false

  override fun fuseboxEnabledRelease(): Boolean = false

  override fun initEagerTurboModulesOnNativeModulesQueueAndroid(): Boolean = true

  override fun lazyAnimationCallbacks(): Boolean = false

  override fun loadVectorDrawablesOnImages(): Boolean = true

  override fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean = false

  override fun useAlwaysAvailableJSErrorHandling(): Boolean = false

  override fun useFabricInterop(): Boolean = false

  override fun useImmediateExecutorInAndroidBridgeless(): Boolean = true

  override fun useNativeViewConfigsInBridgelessMode(): Boolean = false

  override fun useOptimisedViewPreallocationOnAndroid(): Boolean = false

  override fun useOptimizedEventBatchingOnAndroid(): Boolean = false

  override fun useRawPropsJsiValue(): Boolean = false

  override fun useRuntimeShadowNodeReferenceUpdate(): Boolean = true

  override fun useTurboModuleInterop(): Boolean = false

  override fun useTurboModules(): Boolean = false
}
