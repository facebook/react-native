/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import androidx.annotation.Nullable;
import androidx.core.util.Pools;
import com.facebook.infer.annotation.Nullsafe;

/** Implementation of Dynamic wrapping a ReadableArray. */
@Nullsafe(Nullsafe.Mode.LOCAL)
class DynamicFromArray implements Dynamic {
  private static final Pools.SimplePool<DynamicFromArray> sPool = new Pools.SimplePool<>(10);

  private @Nullable ReadableArray mArray;
  private int mIndex = -1;

  // This is a pools object. Hide the constructor.
  private DynamicFromArray() {}

  public static DynamicFromArray create(ReadableArray array, int index) {
    DynamicFromArray dynamic = sPool.acquire();
    if (dynamic == null) {
      dynamic = new DynamicFromArray();
    }
    dynamic.mArray = array;
    dynamic.mIndex = index;
    return dynamic;
  }

  @Override
  public void recycle() {
    mArray = null;
    mIndex = -1;
    sPool.release(this);
  }

  @Override
  public boolean isNull() {
    if (mArray == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mArray.isNull(mIndex);
  }

  @Override
  public boolean asBoolean() {
    if (mArray == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mArray.getBoolean(mIndex);
  }

  @Override
  public double asDouble() {
    if (mArray == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mArray.getDouble(mIndex);
  }

  @Override
  public int asInt() {
    if (mArray == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mArray.getInt(mIndex);
  }

  @Override
  public @Nullable String asString() {
    if (mArray == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mArray.getString(mIndex);
  }

  @Override
  public @Nullable ReadableArray asArray() {
    if (mArray == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mArray.getArray(mIndex);
  }

  @Override
  public @Nullable ReadableMap asMap() {
    if (mArray == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mArray.getMap(mIndex);
  }

  @Override
  public ReadableType getType() {
    if (mArray == null) {
      throw new IllegalStateException("This dynamic value has been recycled");
    }
    return mArray.getType(mIndex);
  }
}
