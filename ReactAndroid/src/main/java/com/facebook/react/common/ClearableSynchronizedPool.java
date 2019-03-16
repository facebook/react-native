// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.common;

import androidx.core.util.Pools;

/**
 * Like {@link androidx.core.util.Pools.SynchronizedPool} with the option to clear the pool
 * (e.g. on memory pressure).
 */
public class ClearableSynchronizedPool<T> implements Pools.Pool<T> {

  private final Object[] mPool;
  private int mSize = 0;

  public ClearableSynchronizedPool(int maxSize) {
    mPool = new Object[maxSize];
  }

  @Override
  public synchronized T acquire() {
    if (mSize == 0) {
      return null;
    }
    mSize--;
    final int lastIndex = mSize;
    T toReturn = (T) mPool[lastIndex];
    mPool[lastIndex] = null;
    return toReturn;
  }

  @Override
  public synchronized boolean release(T obj) {
    if (mSize == mPool.length) {
      return false;
    }
    mPool[mSize] = obj;
    mSize++;
    return true;
  }

  public synchronized void clear() {
    for (int i = 0; i < mSize; i++) {
      mPool[i] = null;
    }
    mSize = 0;
  }
}
