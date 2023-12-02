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
interface ReactNativeConfig {
  /**
   * Get a boolean param by string name. Default should be false.
   *
   * @param param The string name of the parameter being requested.
   */
  @DoNotStrip fun getBool(param: String): Boolean

  /**
   * Get a Long param by string name. Default should be 0.
   *
   * @param param The string name of the parameter being requested.
   */
  @DoNotStrip fun getInt64(param: String): Long

  /**
   * Get a string param by string name. Default should be "", empty string.
   *
   * @param param The string name of the parameter being requested.
   */
  @DoNotStrip fun getString(param: String): String

  /**
   * Get a double param by string name. Default should be 0.
   *
   * @param param The string name of the parameter being requested.
   */
  @DoNotStrip fun getDouble(param: String): Double

  companion object {
    @JvmField val DEFAULT_CONFIG: ReactNativeConfig = EmptyReactNativeConfig()
  }
}
