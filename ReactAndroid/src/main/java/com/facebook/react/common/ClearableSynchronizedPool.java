// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.common;

import android.support.v4.util.Pools;

/**
 * Like {@link android.support.v4.util.Pools.SynchronizedPool} with the option to clear the pool
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
