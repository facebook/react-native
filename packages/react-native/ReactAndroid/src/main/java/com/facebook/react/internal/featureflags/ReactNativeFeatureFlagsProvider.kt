/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<b4a944a07650cf46f90d86419b11bbee>>
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

  @DoNotStrip public fun animatedShouldSignalBatch(): Boolean

  @DoNotStrip public fun cxxNativeAnimatedEnabled(): Boolean

  @DoNotStrip public fun disableMainQueueSyncDispatchIOS(): Boolean

  @DoNotStrip public fun disableMountItemReorderingAndroid(): Boolean

  @DoNotStrip public fun enableAccessibilityOrder(): Boolean

  @DoNotStrip public fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean

  @DoNotStrip public fun enableBridgelessArchitecture(): Boolean

  @DoNotStrip public fun enableCppPropsIteratorSetter(): Boolean

  @DoNotStrip public fun enableCustomFocusSearchOnClippedElementsAndroid(): Boolean

  @DoNotStrip public fun enableDoubleMeasurementFixAndroid(): Boolean

  @DoNotStrip public fun enableEagerRootViewAttachment(): Boolean

  @DoNotStrip public fun enableFabricLogs(): Boolean

  @DoNotStrip public fun enableFabricRenderer(): Boolean

  @DoNotStrip public fun enableFixForParentTagDuringReparenting(): Boolean

  @DoNotStrip public fun enableFontScaleChangesUpdatingLayout(): Boolean

  @DoNotStrip public fun enableIOSViewClipToPaddingBox(): Boolean

  @DoNotStrip public fun enableJSRuntimeGCOnMemoryPressureOnIOS(): Boolean

  @DoNotStrip public fun enableLayoutAnimationsOnAndroid(): Boolean

  @DoNotStrip public fun enableLayoutAnimationsOnIOS(): Boolean

  @DoNotStrip public fun enableMainQueueModulesOnIOS(): Boolean

  @DoNotStrip public fun enableNativeCSSParsing(): Boolean

  @DoNotStrip public fun enableNewBackgroundAndBorderDrawables(): Boolean

  @DoNotStrip public fun enablePropsUpdateReconciliationAndroid(): Boolean

  @DoNotStrip public fun enableSynchronousStateUpdates(): Boolean

  @DoNotStrip public fun enableViewCulling(): Boolean

  @DoNotStrip public fun enableViewRecycling(): Boolean

  @DoNotStrip public fun enableViewRecyclingForText(): Boolean

  @DoNotStrip public fun enableViewRecyclingForView(): Boolean

  @DoNotStrip public fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean

  @DoNotStrip public fun fuseboxEnabledRelease(): Boolean

  @DoNotStrip public fun fuseboxNetworkInspectionEnabled(): Boolean

  @DoNotStrip public fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean

  @DoNotStrip public fun updateRuntimeShadowNodeReferencesOnCommit(): Boolean

  @DoNotStrip public fun useAlwaysAvailableJSErrorHandling(): Boolean

  @DoNotStrip public fun useEditTextStockAndroidFocusBehavior(): Boolean

  @DoNotStrip public fun useFabricInterop(): Boolean

  @DoNotStrip public fun useNativeViewConfigsInBridgelessMode(): Boolean

  @DoNotStrip public fun useOptimizedEventBatchingOnAndroid(): Boolean

  @DoNotStrip public fun useRawPropsJsiValue(): Boolean

  @DoNotStrip public fun useShadowNodeStateOnClone(): Boolean

  @DoNotStrip public fun useTurboModuleInterop(): Boolean

  @DoNotStrip public fun useTurboModules(): Boolean
}
