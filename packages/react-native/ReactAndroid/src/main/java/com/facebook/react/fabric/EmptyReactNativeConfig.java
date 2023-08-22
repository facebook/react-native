/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

/**
 * An empty {@link ReactNativeConfig} that is returning empty responses and false for all the
 * requested keys.
 */
public class EmptyReactNativeConfig implements ReactNativeConfig {

  @Override
  public boolean getBool(final String s) {
    return false;
  }

  @Override
  public long getInt64(final String s) {
    return 0;
  }

  @Override
  public String getString(final String s) {
    return "";
  }

  @Override
  public double getDouble(final String s) {
    return 0;
  }
}
