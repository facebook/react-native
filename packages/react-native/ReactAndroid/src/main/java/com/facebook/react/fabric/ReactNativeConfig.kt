/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import com.facebook.proguard.annotations.DoNotStrip

/**
 * ReactNative Configuration that allows to customize the behavior of key/value pairs used by the
 * framework to enable/disable capabilities.
 *
 * The hosting app should provide an implementation of this interface to allow specific
 * customization of single keys. An empty implementation is available as [EmptyReactNativeConfig].
 *
 * This is a wrapper for the ReactNativeConfig object in C++
 */
@DoNotStrip
public interface ReactNativeConfig {
  public companion object {
    @JvmField public val DEFAULT_CONFIG: ReactNativeConfig = EmptyReactNativeConfig()
  }
}
