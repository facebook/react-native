/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal.featureflags

public object ReactNativeFeatureFlagsForTests {
  public fun setUp() {
    ReactNativeFeatureFlags.setAccessorProvider { ReactNativeFeatureFlagsLocalAccessor() }
  }
}
