/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<ad54375c4ae3be2f377260887ae5aaf9>>
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

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.soloader.SoLoader

@DoNotStrip
public object ReactNativeFeatureFlagsCxxInterop {
  init {
    SoLoader.loadLibrary("react_featureflagsjni")
  }

  @DoNotStrip @JvmStatic public external fun commonTestFlag(): Boolean

  @DoNotStrip @JvmStatic public external fun allowRecursiveCommitsWithSynchronousMountOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun batchRenderingUpdatesInEventLoop(): Boolean

  @DoNotStrip @JvmStatic public external fun completeReactInstanceCreationOnBgThreadOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun destroyFabricSurfacesInReactInstanceManager(): Boolean

  @DoNotStrip @JvmStatic public external fun enableAlignItemsBaselineOnFabricIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun enableAndroidMixBlendModeProp(): Boolean

  @DoNotStrip @JvmStatic public external fun enableBackgroundStyleApplicator(): Boolean

  @DoNotStrip @JvmStatic public external fun enableCleanTextInputYogaNode(): Boolean

  @DoNotStrip @JvmStatic public external fun enableEagerRootViewAttachment(): Boolean

  @DoNotStrip @JvmStatic public external fun enableEventEmitterRetentionDuringGesturesOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableFabricLogs(): Boolean

  @DoNotStrip @JvmStatic public external fun enableFabricRendererExclusively(): Boolean

  @DoNotStrip @JvmStatic public external fun enableGranularShadowTreeStateReconciliation(): Boolean

  @DoNotStrip @JvmStatic public external fun enableIOSViewClipToPaddingBox(): Boolean

  @DoNotStrip @JvmStatic public external fun enableLayoutAnimationsOnIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun enableLongTaskAPI(): Boolean

  @DoNotStrip @JvmStatic public external fun enableMicrotasks(): Boolean

  @DoNotStrip @JvmStatic public external fun enablePropsUpdateReconciliationAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableReportEventPaintTime(): Boolean

  @DoNotStrip @JvmStatic public external fun enableSynchronousStateUpdates(): Boolean

  @DoNotStrip @JvmStatic public external fun enableUIConsistency(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewRecycling(): Boolean

  @DoNotStrip @JvmStatic public external fun excludeYogaFromRawProps(): Boolean

  @DoNotStrip @JvmStatic public external fun fetchImagesInViewPreallocation(): Boolean

  @DoNotStrip @JvmStatic public external fun fixIncorrectScrollViewStateUpdateOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean

  @DoNotStrip @JvmStatic public external fun fixMissedFabricStateUpdatesOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun fixMountingCoordinatorReportedPendingTransactionsOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun forceBatchingMountItemsOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun fuseboxEnabledDebug(): Boolean

  @DoNotStrip @JvmStatic public external fun fuseboxEnabledRelease(): Boolean

  @DoNotStrip @JvmStatic public external fun initEagerTurboModulesOnNativeModulesQueueAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun lazyAnimationCallbacks(): Boolean

  @DoNotStrip @JvmStatic public external fun loadVectorDrawablesOnImages(): Boolean

  @DoNotStrip @JvmStatic public external fun setAndroidLayoutDirection(): Boolean

  @DoNotStrip @JvmStatic public external fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun useFabricInterop(): Boolean

  @DoNotStrip @JvmStatic public external fun useImmediateExecutorInAndroidBridgeless(): Boolean

  @DoNotStrip @JvmStatic public external fun useModernRuntimeScheduler(): Boolean

  @DoNotStrip @JvmStatic public external fun useNativeViewConfigsInBridgelessMode(): Boolean

  @DoNotStrip @JvmStatic public external fun useNewReactImageViewBackgroundDrawing(): Boolean

  @DoNotStrip @JvmStatic public external fun useOptimisedViewPreallocationOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun useOptimizedEventBatchingOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun useRuntimeShadowNodeReferenceUpdate(): Boolean

  @DoNotStrip @JvmStatic public external fun useRuntimeShadowNodeReferenceUpdateOnLayout(): Boolean

  @DoNotStrip @JvmStatic public external fun useStateAlignmentMechanism(): Boolean

  @DoNotStrip @JvmStatic public external fun useTurboModuleInterop(): Boolean

  @DoNotStrip @JvmStatic public external fun override(provider: Any)

  @DoNotStrip @JvmStatic public external fun dangerouslyReset()
}
