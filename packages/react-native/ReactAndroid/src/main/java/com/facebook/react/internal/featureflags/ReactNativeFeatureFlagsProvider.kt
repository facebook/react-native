/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<145aa050506193198208ec7601b7da10>>
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

  @DoNotStrip public fun completeReactInstanceCreationOnBgThreadOnAndroid(): Boolean

  @DoNotStrip public fun disableEventLoopOnBridgeless(): Boolean

  @DoNotStrip public fun disableMountItemReorderingAndroid(): Boolean

  @DoNotStrip public fun enableAlignItemsBaselineOnFabricIOS(): Boolean

  @DoNotStrip public fun enableAndroidLineHeightCentering(): Boolean

  @DoNotStrip public fun enableBridgelessArchitecture(): Boolean

  @DoNotStrip public fun enableCppPropsIteratorSetter(): Boolean

  @DoNotStrip public fun enableDeletionOfUnmountedViews(): Boolean

  @DoNotStrip public fun enableEagerRootViewAttachment(): Boolean

  @DoNotStrip public fun enableEventEmitterRetentionDuringGesturesOnAndroid(): Boolean

  @DoNotStrip public fun enableFabricLogs(): Boolean

  @DoNotStrip public fun enableFabricRenderer(): Boolean

  @DoNotStrip public fun enableFabricRendererExclusively(): Boolean

  @DoNotStrip public fun enableFixForViewCommandRace(): Boolean

  @DoNotStrip public fun enableGranularShadowTreeStateReconciliation(): Boolean

  @DoNotStrip public fun enableIOSViewClipToPaddingBox(): Boolean

  @DoNotStrip public fun enableImagePrefetchingAndroid(): Boolean

  @DoNotStrip public fun enableLayoutAnimationsOnAndroid(): Boolean

  @DoNotStrip public fun enableLayoutAnimationsOnIOS(): Boolean

  @DoNotStrip public fun enableLongTaskAPI(): Boolean

  @DoNotStrip public fun enableNewBackgroundAndBorderDrawables(): Boolean

  @DoNotStrip public fun enablePreciseSchedulingForPremountItemsOnAndroid(): Boolean

  @DoNotStrip public fun enablePropsUpdateReconciliationAndroid(): Boolean

  @DoNotStrip public fun enableReportEventPaintTime(): Boolean

  @DoNotStrip public fun enableSynchronousStateUpdates(): Boolean

  @DoNotStrip public fun enableUIConsistency(): Boolean

  @DoNotStrip public fun enableViewRecycling(): Boolean

  @DoNotStrip public fun excludeYogaFromRawProps(): Boolean

  @DoNotStrip public fun fixDifferentiatorEmittingUpdatesWithWrongParentTag(): Boolean

  @DoNotStrip public fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean

  @DoNotStrip public fun fixMountingCoordinatorReportedPendingTransactionsOnAndroid(): Boolean

  @DoNotStrip public fun fuseboxEnabledDebug(): Boolean

  @DoNotStrip public fun fuseboxEnabledRelease(): Boolean

  @DoNotStrip public fun initEagerTurboModulesOnNativeModulesQueueAndroid(): Boolean

  @DoNotStrip public fun lazyAnimationCallbacks(): Boolean

  @DoNotStrip public fun loadVectorDrawablesOnImages(): Boolean

  @DoNotStrip public fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean

  @DoNotStrip public fun useAlwaysAvailableJSErrorHandling(): Boolean

  @DoNotStrip public fun useFabricInterop(): Boolean

  @DoNotStrip public fun useImmediateExecutorInAndroidBridgeless(): Boolean

  @DoNotStrip public fun useNativeViewConfigsInBridgelessMode(): Boolean

  @DoNotStrip public fun useOptimisedViewPreallocationOnAndroid(): Boolean

  @DoNotStrip public fun useOptimizedEventBatchingOnAndroid(): Boolean

  @DoNotStrip public fun useRawPropsJsiValue(): Boolean

  @DoNotStrip public fun useRuntimeShadowNodeReferenceUpdate(): Boolean

  @DoNotStrip public fun useTurboModuleInterop(): Boolean

  @DoNotStrip public fun useTurboModules(): Boolean
}
