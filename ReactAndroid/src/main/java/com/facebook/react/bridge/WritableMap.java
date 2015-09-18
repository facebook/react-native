/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

/**
 * Interface for a mutable map. Used to pass arguments from Java to JS.
 */
public interface WritableMap extends ReadableMap {

  void putNull(String key);
  void putBoolean(String key, boolean value);
  void putDouble(String key, double value);
  void putInt(String key, int value);
  void putString(String key, String value);
  void putArray(String key, WritableArray value);
  void putMap(String key, WritableMap value);

  void merge(ReadableMap source);
}
