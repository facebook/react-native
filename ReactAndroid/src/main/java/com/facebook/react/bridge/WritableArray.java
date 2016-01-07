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
