/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal.featureflags

public class ReactNativeFeatureFlagsOverrides_RNOSS_Stable_Android(
    private val fabricEnabled: Boolean,
    private val bridgelessEnabled: Boolean,
    private val turboModulesEnabled: Boolean
) : ReactNativeNewArchitectureFeatureFlagsDefaults(bridgelessEnabled) {
  override fun useFabricInterop(): Boolean = bridgelessEnabled || fabricEnabled

  override fun enableFabricRenderer(): Boolean = bridgelessEnabled || fabricEnabled

  override fun useTurboModules(): Boolean = bridgelessEnabled || turboModulesEnabled

  override fun updateRuntimeShadowNodeReferencesOnCommit(): Boolean = true

  override fun useShadowNodeStateOnClone(): Boolean = true
}
