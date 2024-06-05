/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<d84816a13ad49b6e1c69c968a8503385>>
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

@DoNotStrip
public interface ReactNativeFeatureFlagsProvider {
  @DoNotStrip public fun commonTestFlag(): Boolean

  @DoNotStrip public fun allowCollapsableChildren(): Boolean

  @DoNotStrip public fun allowRecursiveCommitsWithSynchronousMountOnAndroid(): Boolean

  @DoNotStrip public fun batchRenderingUpdatesInEventLoop(): Boolean

  @DoNotStrip public fun destroyFabricSurfacesInReactInstanceManager(): Boolean

  @DoNotStrip public fun enableBackgroundExecutor(): Boolean

  @DoNotStrip public fun enableCleanTextInputYogaNode(): Boolean

  @DoNotStrip public fun enableGranularShadowTreeStateReconciliation(): Boolean

  @DoNotStrip public fun enableMicrotasks(): Boolean

  @DoNotStrip public fun enableSynchronousStateUpdates(): Boolean

  @DoNotStrip public fun enableUIConsistency(): Boolean

  @DoNotStrip public fun fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak(): Boolean

  @DoNotStrip public fun forceBatchingMountItemsOnAndroid(): Boolean

  @DoNotStrip public fun fuseboxEnabledDebug(): Boolean

  @DoNotStrip public fun fuseboxEnabledRelease(): Boolean

  @DoNotStrip public fun lazyAnimationCallbacks(): Boolean

  @DoNotStrip public fun preventDoubleTextMeasure(): Boolean

  @DoNotStrip public fun setAndroidLayoutDirection(): Boolean

  @DoNotStrip public fun useImmediateExecutorInAndroidBridgeless(): Boolean

  @DoNotStrip public fun useModernRuntimeScheduler(): Boolean

  @DoNotStrip public fun useNativeViewConfigsInBridgelessMode(): Boolean

  @DoNotStrip public fun useRuntimeShadowNodeReferenceUpdate(): Boolean

  @DoNotStrip public fun useRuntimeShadowNodeReferenceUpdateOnLayout(): Boolean

  @DoNotStrip public fun useStateAlignmentMechanism(): Boolean
}
