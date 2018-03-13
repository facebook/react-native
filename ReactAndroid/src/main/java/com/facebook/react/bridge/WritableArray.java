/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/**
 * Interface for a mutable array. Used to pass arguments from Java to JS.
 */
public interface WritableArray extends ReadableArray {

  void pushNull();
  void pushBoolean(boolean value);
  void pushDouble(double value);
  void pushInt(int value);
  void pushString(String value);
  void pushArray(WritableArray array);
  void pushMap(WritableMap map);
}
