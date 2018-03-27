/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import java.util.ArrayList;

/**
 * Interface for an array that allows typed access to its members. Used to pass parameters from JS
 * to Java.
 */
public interface ReadableArray {

  int size();
  boolean isNull(int index);
  boolean getBoolean(int index);
  double getDouble(int index);
  int getInt(int index);
  String getString(int index);
  ReadableArray getArray(int index);
  ReadableMap getMap(int index);
  Dynamic getDynamic(int index);
  ReadableType getType(int index);
  ArrayList<Object> toArrayList();

}
