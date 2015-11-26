/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * A simple read/write array that can be used in tests in place of {@link WritableNativeArray}.
 */
public class SimpleArray implements ReadableArray, WritableArray {

  private final List mBackingList;

  public static SimpleArray from(List list) {
    return new SimpleArray(list);
  }

  public static SimpleArray of(Object... values) {
    return new SimpleArray(values);
  }

  private SimpleArray(Object... values) {
    mBackingList = Arrays.asList(values);
  }

  private SimpleArray(List list) {
    mBackingList = new ArrayList(list);
  }

  public SimpleArray() {
    mBackingList = new ArrayList();
  }

  @Override
  public int size() {
    return mBackingList.size();
  }

  @Override
  public boolean isNull(int index) {
    return mBackingList.get(index) == null;
  }

  @Override
  public double getDouble(int index) {
    return (Double) mBackingList.get(index);
  }

  @Override
  public int getInt(int index) {
    return (Integer) mBackingList.get(index);
  }

  @Override
  public String getString(int index) {
    return (String) mBackingList.get(index);
  }

  @Override
  public SimpleArray getArray(int index) {
    return (SimpleArray) mBackingList.get(index);
  }

  @Override
  public boolean getBoolean(int index) {
    return (Boolean) mBackingList.get(index);
  }

  @Override
  public SimpleMap getMap(int index) {
    return (SimpleMap) mBackingList.get(index);
  }

  @Override
  public ReadableType getType(int index) {
    return null;
  }

  @Override
  public void pushBoolean(boolean value) {
    mBackingList.add(value);
  }

  @Override
  public void pushDouble(double value) {
    mBackingList.add(value);
  }

  @Override
  public void pushInt(int value) {
    mBackingList.add(value);
  }

  @Override
  public void pushString(String value) {
    mBackingList.add(value);
  }

  @Override
  public void pushArray(WritableArray array) {
    mBackingList.add(array);
  }

  @Override
  public void pushMap(WritableMap map) {
    mBackingList.add(map);
  }

  @Override
  public void pushNull() {
    mBackingList.add(null);
  }

  @Override
  public String toString() {
    return mBackingList.toString();
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;

    SimpleArray that = (SimpleArray) o;

    if (mBackingList != null ? !mBackingList.equals(that.mBackingList) : that.mBackingList != null)
      return false;

    return true;
  }

  @Override
  public int hashCode() {
    return mBackingList != null ? mBackingList.hashCode() : 0;
  }
}
