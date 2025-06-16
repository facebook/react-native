/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<2151e5ec5d04924e742f37b527dc23b9>>
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
import com.facebook.soloader.SoLoader

@DoNotStrip
public object ReactNativeFeatureFlagsCxxInterop {
  init {
    SoLoader.loadLibrary("react_featureflagsjni")
  }

  @DoNotStrip @JvmStatic public external fun commonTestFlag(): Boolean

  @DoNotStrip @JvmStatic public external fun disableMountItemReorderingAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableBridgelessArchitecture(): Boolean

  @DoNotStrip @JvmStatic public external fun enableCppPropsIteratorSetter(): Boolean

  @DoNotStrip @JvmStatic public external fun enableEagerRootViewAttachment(): Boolean

  @DoNotStrip @JvmStatic public external fun enableFabricLogs(): Boolean

  @DoNotStrip @JvmStatic public external fun enableFabricRenderer(): Boolean

  @DoNotStrip @JvmStatic public external fun enableIOSViewClipToPaddingBox(): Boolean

  @DoNotStrip @JvmStatic public external fun enableImagePrefetchingAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableJSRuntimeGCOnMemoryPressureOnIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun enableLayoutAnimationsOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableLayoutAnimationsOnIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun enableLongTaskAPI(): Boolean

  @DoNotStrip @JvmStatic public external fun enableNativeCSSParsing(): Boolean

  @DoNotStrip @JvmStatic public external fun enableNewBackgroundAndBorderDrawables(): Boolean

  @DoNotStrip @JvmStatic public external fun enablePreciseSchedulingForPremountItemsOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enablePropsUpdateReconciliationAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableReportEventPaintTime(): Boolean

  @DoNotStrip @JvmStatic public external fun enableSynchronousStateUpdates(): Boolean

  @DoNotStrip @JvmStatic public external fun enableUIConsistency(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewCulling(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewRecycling(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewRecyclingForText(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewRecyclingForView(): Boolean

  @DoNotStrip @JvmStatic public external fun excludeYogaFromRawProps(): Boolean

  @DoNotStrip @JvmStatic public external fun fixDifferentiatorEmittingUpdatesWithWrongParentTag(): Boolean

  @DoNotStrip @JvmStatic public external fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean

  @DoNotStrip @JvmStatic public external fun fixMountingCoordinatorReportedPendingTransactionsOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun fuseboxEnabledRelease(): Boolean

  @DoNotStrip @JvmStatic public external fun fuseboxNetworkInspectionEnabled(): Boolean

  @DoNotStrip @JvmStatic public external fun lazyAnimationCallbacks(): Boolean

  @DoNotStrip @JvmStatic public external fun removeTurboModuleManagerDelegateMutex(): Boolean

  @DoNotStrip @JvmStatic public external fun throwExceptionInsteadOfDeadlockOnTurboModuleSetupDuringSyncRenderIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun updateRuntimeShadowNodeReferencesOnCommit(): Boolean

  @DoNotStrip @JvmStatic public external fun useAlwaysAvailableJSErrorHandling(): Boolean

  @DoNotStrip @JvmStatic public external fun useFabricInterop(): Boolean

  @DoNotStrip @JvmStatic public external fun useNativeViewConfigsInBridgelessMode(): Boolean

  @DoNotStrip @JvmStatic public external fun useOptimizedEventBatchingOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun useRawPropsJsiValue(): Boolean

  @DoNotStrip @JvmStatic public external fun useShadowNodeStateOnClone(): Boolean

  @DoNotStrip @JvmStatic public external fun useTurboModuleInterop(): Boolean

  @DoNotStrip @JvmStatic public external fun useTurboModules(): Boolean

  @DoNotStrip @JvmStatic public external fun override(provider: Any)

  @DoNotStrip @JvmStatic public external fun dangerouslyReset()

  @DoNotStrip @JvmStatic public external fun dangerouslyForceOverride(provider: Any): String?
}
