/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<4462edcf10a85654be7c71a7438a2288>>
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

  override fun androidEnablePendingFabricTransactions(): Boolean = false

  override fun batchRenderingUpdatesInEventLoop(): Boolean = false

  override fun destroyFabricSurfacesInReactInstanceManager(): Boolean = false

  override fun enableBackgroundExecutor(): Boolean = false

  override fun useModernRuntimeScheduler(): Boolean = false

  override fun enableMicrotasks(): Boolean = false

  override fun enableSpannableBuildingUnification(): Boolean = false

  override fun enableCustomDrawOrderFabric(): Boolean = false

  override fun enableFixForClippedSubviewsCrash(): Boolean = false

  override fun inspectorEnableCxxInspectorPackagerConnection(): Boolean = false

  override fun inspectorEnableModernCDPRegistry(): Boolean = false
}
