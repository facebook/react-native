/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<7c95ebf976344317cd8904d71ea22fe5>>
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

  override fun allowCollapsableChildren(): Boolean = true

  override fun allowRecursiveCommitsWithSynchronousMountOnAndroid(): Boolean = false

  override fun batchRenderingUpdatesInEventLoop(): Boolean = false

  override fun destroyFabricSurfacesInReactInstanceManager(): Boolean = false

  override fun enableBackgroundExecutor(): Boolean = false

  override fun enableCleanTextInputYogaNode(): Boolean = false

  override fun enableGranularShadowTreeStateReconciliation(): Boolean = false

  override fun enableMicrotasks(): Boolean = false

  override fun enableSynchronousStateUpdates(): Boolean = false

  override fun enableUIConsistency(): Boolean = false

  override fun fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak(): Boolean = false

  override fun forceBatchingMountItemsOnAndroid(): Boolean = false

  override fun fuseboxEnabledDebug(): Boolean = false

  override fun fuseboxEnabledRelease(): Boolean = false

  override fun lazyAnimationCallbacks(): Boolean = false

  override fun preventDoubleTextMeasure(): Boolean = true

  override fun setAndroidLayoutDirection(): Boolean = false

  override fun useImmediateExecutorInAndroidBridgeless(): Boolean = false

  override fun useModernRuntimeScheduler(): Boolean = false

  override fun useNativeViewConfigsInBridgelessMode(): Boolean = false

  override fun useRuntimeShadowNodeReferenceUpdate(): Boolean = false

  override fun useRuntimeShadowNodeReferenceUpdateOnLayout(): Boolean = false

  override fun useStateAlignmentMechanism(): Boolean = false
}
