/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import androidx.annotation.NonNull;
import com.facebook.proguard.annotations.DoNotStrip;

// This is a wrapper for the ReactNativeConfig object in C++
@DoNotStrip
public interface ReactNativeConfig {
  /**
   * Get a boolean param by string name. Default should be false.
   *
   * @param param The string name of the parameter being requested.
   */
  @DoNotStrip
  boolean getBool(@NonNull String param);

  /**
   * Get an integer param by string name. Default should be 0.
   *
   * @param param The string name of the parameter being requested.
   */
  @DoNotStrip
  int getInt64(@NonNull String param);

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
