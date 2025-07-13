/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal.featureflags

internal interface ReactNativeFeatureFlagsAccessor : ReactNativeFeatureFlagsProvider {
  fun override(provider: ReactNativeFeatureFlagsProvider)

  fun dangerouslyReset()

  fun dangerouslyForceOverride(provider: ReactNativeFeatureFlagsProvider): String?
}
