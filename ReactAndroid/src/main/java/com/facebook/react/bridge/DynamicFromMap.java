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
 * Implementation of Dynamic wrapping a ReadableMap.
 */
public class DynamicFromMap implements Dynamic {

  private final ReadableMap mMap;
  private final String mName;

  public DynamicFromMap(ReadableMap map, String name) {
    mMap = map;
    mName = name;
  }

  @Override
  public boolean asBoolean() {
    return mMap.getBoolean(mName);
  }

  @Override
  public double asDouble() {
    return mMap.getDouble(mName);
  }

  @Override
  public int asInt() {
    return mMap.getInt(mName);
  }

  @Override
  public String asString() {
    return mMap.getString(mName);
  }

  @Override
  public ReadableArray asArray() {
    return mMap.getArray(mName);
  }

  @Override
  public ReadableMap asMap() {
    return mMap.getMap(mName);
  }

  @Override
  public ReadableType getType() {
    return mMap.getType(mName);
  }
}
