/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import androidx.annotation.Nullable;
import androidx.core.util.Pools.SimplePool;

/** Implementation of Dynamic wrapping a ReadableMap. */
public class DynamicFromMap implements Dynamic {
  private static final ThreadLocal<SimplePool<DynamicFromMap>> sPool =
      new ThreadLocal<SimplePool<DynamicFromMap>>() {
        @Override
        protected SimplePool<DynamicFromMap> initialValue() {
          return new SimplePool<>(10);
        }
      };

  private @Nullable ReadableMap mMap;
  private @Nullable String mName;

  // This is a pools object. Hide the constructor.
  private DynamicFromMap() {}

  public static DynamicFromMap create(ReadableMap map, String name) {
    DynamicFromMap dynamic = sPool.get().acquire();
    if (dynamic == null) {
      dynamic = new DynamicFromMap();
    }
    dynamic.mMap = map;
    dynamic.mName = name;
    return dynamic;
  }

  @Override
  public void recycle() {
    mMap = null;
    mName = null;
    sPool.get().release(this);
  }

  @Override
  public boolean isNull() {
    if (mMap == null || mName == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mMap.isNull(mName);
  }

  @Override
  public boolean asBoolean() {
    if (mMap == null || mName == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mMap.getBoolean(mName);
  }

  @Override
  public double asDouble() {
    if (mMap == null || mName == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mMap.getDouble(mName);
  }

  @Override
  public int asInt() {
    if (mMap == null || mName == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mMap.getInt(mName);
  }

  @Override
  public String asString() {
    if (mMap == null || mName == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mMap.getString(mName);
  }

  @Override
  public ReadableArray asArray() {
    if (mMap == null || mName == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mMap.getArray(mName);
  }

  @Override
  public ReadableMap asMap() {
    if (mMap == null || mName == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mMap.getMap(mName);
  }

  @Override
  public ReadableType getType() {
    if (mMap == null || mName == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mMap.getType(mName);
  }
}
