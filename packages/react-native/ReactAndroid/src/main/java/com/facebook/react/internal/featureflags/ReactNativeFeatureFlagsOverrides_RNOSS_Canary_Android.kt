/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<04b05f74eacf566f99d00c630dcb61f4>>
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

public open class ReactNativeFeatureFlagsOverrides_RNOSS_Canary_Android : ReactNativeFeatureFlagsDefaults() {
  // We could use JNI to get the defaults from C++,
  // but that is more expensive than just duplicating the defaults here.

  override fun enableBridgelessArchitecture(): Boolean = true

  override fun enableFabricRenderer(): Boolean = true

  override fun useFabricInterop(): Boolean = true

  override fun useNativeViewConfigsInBridgelessMode(): Boolean = true

  override fun useTurboModuleInterop(): Boolean = true

  override fun useTurboModules(): Boolean = true
}
