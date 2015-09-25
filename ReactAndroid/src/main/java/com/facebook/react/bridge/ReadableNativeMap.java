/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import com.facebook.jni.Countable;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

/**
 * Implementation of a read-only map in native memory. This will generally be constructed and filled
 * in native code so you shouldn't construct one yourself.
 */
@DoNotStrip
public class ReadableNativeMap extends NativeMap implements ReadableMap {

  static {
    SoLoader.loadLibrary(ReactBridge.REACT_NATIVE_LIB);
  }

  @Override
  public native boolean hasKey(String name);
  @Override
  public native boolean isNull(String name);
  @Override
  public native boolean getBoolean(String name);
  @Override
  public native double getDouble(String name);
  @Override
  public native int getInt(String name);
  @Override
  public native String getString(String name);
  @Override
  public native ReadableNativeArray getArray(String name);
  @Override
  public native ReadableNativeMap getMap(String name);
  @Override
  public native ReadableType getType(String name);

  @Override
  public ReadableMapKeySeyIterator keySetIterator() {
    return new ReadableNativeMapKeySeyIterator(this);
  }

  /**
   * Implementation of a {@link ReadableNativeMap} iterator in native memory.
   */
  @DoNotStrip
  private static class ReadableNativeMapKeySeyIterator extends Countable
      implements ReadableMapKeySeyIterator {

    private final ReadableNativeMap mReadableNativeMap;

    public ReadableNativeMapKeySeyIterator(ReadableNativeMap readableNativeMap) {
      mReadableNativeMap = readableNativeMap;
      initialize(mReadableNativeMap);
    }

    @Override
    public native boolean hasNextKey();
    @Override
    public native String nextKey();

    private native void initialize(ReadableNativeMap readableNativeMap);
  }
}
