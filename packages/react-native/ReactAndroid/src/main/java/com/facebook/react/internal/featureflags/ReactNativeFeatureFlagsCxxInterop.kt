/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<05bf91e1b2a64cdc48615137deec627a>>
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

  @DoNotStrip @JvmStatic public external fun allowCollapsableChildren(): Boolean

  @DoNotStrip @JvmStatic public external fun allowRecursiveCommitsWithSynchronousMountOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun batchRenderingUpdatesInEventLoop(): Boolean

  @DoNotStrip @JvmStatic public external fun destroyFabricSurfacesInReactInstanceManager(): Boolean

  @DoNotStrip @JvmStatic public external fun enableBackgroundExecutor(): Boolean

  @DoNotStrip @JvmStatic public external fun enableCleanTextInputYogaNode(): Boolean

  @DoNotStrip @JvmStatic public external fun enableGranularShadowTreeStateReconciliation(): Boolean

  @DoNotStrip @JvmStatic public external fun enableMicrotasks(): Boolean

  @DoNotStrip @JvmStatic public external fun enableSynchronousStateUpdates(): Boolean

  @DoNotStrip @JvmStatic public external fun enableUIConsistency(): Boolean

  @DoNotStrip @JvmStatic public external fun fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak(): Boolean

  @DoNotStrip @JvmStatic public external fun forceBatchingMountItemsOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun fuseboxEnabledDebug(): Boolean

  @DoNotStrip @JvmStatic public external fun fuseboxEnabledRelease(): Boolean

  @DoNotStrip @JvmStatic public external fun lazyAnimationCallbacks(): Boolean

  @DoNotStrip @JvmStatic public external fun preventDoubleTextMeasure(): Boolean

  @DoNotStrip @JvmStatic public external fun setAndroidLayoutDirection(): Boolean

  @DoNotStrip @JvmStatic public external fun useImmediateExecutorInAndroidBridgeless(): Boolean

  @DoNotStrip @JvmStatic public external fun useModernRuntimeScheduler(): Boolean

  @DoNotStrip @JvmStatic public external fun useNativeViewConfigsInBridgelessMode(): Boolean

  @DoNotStrip @JvmStatic public external fun useRuntimeShadowNodeReferenceUpdate(): Boolean

  @DoNotStrip @JvmStatic public external fun useRuntimeShadowNodeReferenceUpdateOnLayout(): Boolean

  @DoNotStrip @JvmStatic public external fun useStateAlignmentMechanism(): Boolean

  @DoNotStrip @JvmStatic public external fun override(provider: Any)

  @DoNotStrip @JvmStatic public external fun dangerouslyReset()
}
