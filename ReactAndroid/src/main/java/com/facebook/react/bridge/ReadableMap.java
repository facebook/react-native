/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import java.util.HashMap;

/**
 * Interface for a map that allows typed access to its members. Used to pass parameters from JS to
 * Java.
 */
public interface ReadableMap {

  boolean hasKey(String name);
  boolean isNull(String name);
  boolean getBoolean(String name);
  double getDouble(String name);
  int getInt(String name);
  String getString(String name);
  ReadableArray getArray(String name);
  ReadableMap getMap(String name);
  Dynamic getDynamic(String name);
  ReadableType getType(String name);
  ReadableMapKeySetIterator keySetIterator();
  HashMap<String, Object> toHashMap();

}
