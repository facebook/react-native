/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import androidx.annotation.NonNull;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * ReactNative Configuration that allows to customize the behavior of key/value pairs used by the
 * framework to enable/disable capabilities.
 *
 * <p>The hosting app should provide an implementation of this interface to allow specific
 * customization of single keys. An empty implementation is available as {@link
 * EmptyReactNativeConfig}.
 *
 * <p>This is a wrapper for the ReactNativeConfig object in C++
 */
@DoNotStrip
public interface ReactNativeConfig {

  ReactNativeConfig DEFAULT_CONFIG = new EmptyReactNativeConfig();

  /**
   * Get a boolean param by string name. Default should be false.
   *
   * @param param The string name of the parameter being requested.
   */
  @DoNotStrip
  boolean getBool(@NonNull String param);

  /**
   * Get a Long param by string name. Default should be 0.
   *
   * @param param The string name of the parameter being requested.
   */
  @DoNotStrip
  long getInt64(@NonNull String param);

  /**
   * Get a string param by string name. Default should be "", empty string.
   *
   * @param param The string name of the parameter being requested.
   */
  @DoNotStrip
  String getString(@NonNull String param);

  /**
   * Get a double param by string name. Default should be 0.
   *
   * @param param The string name of the parameter being requested.
   */
  @DoNotStrip
  double getDouble(@NonNull String param);
}
