/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<961f1fb0a7ad802a492437f15b1f2dcb>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.json.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

package com.facebook.react.internal.featureflags

class ReactNativeFeatureFlagsCxxAccessor : ReactNativeFeatureFlagsAccessor {
  private var commonTestFlagCache: Boolean? = null

  override fun commonTestFlag(): Boolean {
    var cached = commonTestFlagCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.commonTestFlag()
      commonTestFlagCache = cached
    }
    return cached
  }

  override fun override(provider: ReactNativeFeatureFlagsProvider) =
      ReactNativeFeatureFlagsCxxInterop.override(provider as Any)

  override fun dangerouslyReset() = ReactNativeFeatureFlagsCxxInterop.dangerouslyReset()
}
