/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.fabric;

// This is a wrapper for the ReactNativeConfig object in C++
public interface ReactNativeConfig {
  boolean getBool(String param);
  int getInt64(String param);
  String getString(String param);
  double getDouble(String param);
}
