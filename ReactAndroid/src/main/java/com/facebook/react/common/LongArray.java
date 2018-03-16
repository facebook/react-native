/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common;

/**
 * Object wrapping an auto-expanding long[]. Like an ArrayList<Long> but without the autoboxing.
 */
public class LongArray {

  private static final double INNER_ARRAY_GROWTH_FACTOR = 1.8;

  private long[] mArray;
  private int mLength;

  public static LongArray createWithInitialCapacity(int initialCapacity) {
    return new LongArray(initialCapacity);
  }

  private LongArray(int initialCapacity) {
    mArray = new long[initialCapacity];
    mLength = 0;
  }

  public void add(long value) {
    growArrayIfNeeded();
    mArray[mLength++] = value;
  }

  public long get(int index) {
    if (index >= mLength) {
      throw new IndexOutOfBoundsException("" + index + " >= " + mLength);
    }
    return mArray[index];
  }

  public void set(int index, long value) {
    if (index >= mLength) {
      throw new IndexOutOfBoundsException("" + index + " >= " + mLength);
    }
    mArray[index] = value;
  }

  public int size() {
    return mLength;
  }

  public boolean isEmpty() {
    return mLength == 0;
  }

  /**
   * Removes the *last* n items of the array all at once.
   */
  public void dropTail(int n) {
    if (n > mLength) {
      throw new IndexOutOfBoundsException(
          "Trying to drop " + n + " items from array of length " + mLength);
    }
    mLength -= n;
  }

  private void growArrayIfNeeded() {
    if (mLength == mArray.length) {
      // If the initial capacity was 1 we need to ensure it at least grows by 1.
      int newSize = Math.max(mLength + 1, (int)(mLength * INNER_ARRAY_GROWTH_FACTOR));
      long[] newArray = new long[newSize];
      System.arraycopy(mArray, 0, newArray, 0, mLength);
      mArray = newArray;
    }
  }
}
