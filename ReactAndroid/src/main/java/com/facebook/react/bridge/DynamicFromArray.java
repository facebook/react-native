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
 * Implementation of Dynamic wrapping a ReadableArray.
 */
public class DynamicFromArray implements Dynamic {

  private final ReadableArray mArray;
  private final int mIndex;

  public DynamicFromArray(ReadableArray array, int index) {
    mArray = array;
    mIndex = index;
  }

  @Override
  public boolean asBoolean() {
    return mArray.getBoolean(mIndex);
  }

  @Override
  public double asDouble() {
    return mArray.getDouble(mIndex);
  }

  @Override
  public int asInt() {
    return mArray.getInt(mIndex);
  }

  @Override
  public String asString() {
    return mArray.getString(mIndex);
  }

  @Override
  public ReadableArray asArray() {
    return mArray.getArray(mIndex);
  }

  @Override
  public ReadableMap asMap() {
    return mArray.getMap(mIndex);
  }

  @Override
  public ReadableType getType() {
    return mArray.getType(mIndex);
  }
}
