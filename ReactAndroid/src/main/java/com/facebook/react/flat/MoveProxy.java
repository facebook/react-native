/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactShadowNodeImpl;
import javax.annotation.Nullable;

/**
 * Helper class that sorts moveFrom/moveTo arrays in lockstep.
 */
/* package */ final class MoveProxy {

  private @Nullable ReadableArray mMoveTo;
  private int mSize;
  private int[] mMapping = new int[8];
  private ReactShadowNode[] mChildren = new ReactShadowNodeImpl[4];

  /**
   * Retuns size of underlying moveTo/moveFrom arrays
   */
  public int size() {
    return mSize;
  }

  /**
   * Assigns ith child that we want to move if moveFrom was sorted.
   */
  public void setChildMoveFrom(int moveFromIndex, ReactShadowNode node) {
    mChildren[moveFromToIndex(moveFromIndex)] = node;
  }

  /**
   * Returns ith child that we want to move if moveTo was sorted.
   */
  public ReactShadowNode getChildMoveTo(int moveToIndex) {
    return mChildren[moveToToIndex(moveToIndex)];
  }

  /**
   * Returns index of the ith child that we want to move if moveFrom was sorted
   */
  public int getMoveFrom(int moveFromIndex) {
    return moveFromToValue(moveFromIndex);
  }

  /**
   * Returns index of the ith child that we want to move to if moveTo was sorted
   */
  public int getMoveTo(int moveToIndex) {
    return moveToToValue(moveToIndex);
  }

  /**
   * Initialize MoveProxy with given moveFrom and moveTo arrays.
   */
  public void setup(ReadableArray moveFrom, ReadableArray moveTo) {
    mMoveTo = moveTo;

    if (moveFrom == null) {
      setSize(0);
      return;
    }

    int size = moveFrom.size();
    int requiredSpace = size + size;
    if (mMapping.length < requiredSpace) {
      mMapping = new int[requiredSpace];
      mChildren = new FlatShadowNode[size];
    }

    setSize(size);

    // Array contains data in the following way:
    // [ k0, v0, k1, v1, k2, v2, ... ]
    //
    // where vi = moveFrom.getInt(ki)

    // We don't technically *need* to store vi, but they are accessed so often that it makes sense
    // to cache it instead of calling ReadableArray.getInt() all the time.

    // Sorting algorithm will reorder ki/vi pairs in such a way that vi < v(i+1)

    // Code below is an insertion sort, adapted from DualPivotQuicksort.doSort()

    // At each step i, we got the following data:

    // [k0, v0, k1, v2, .. k(i-1), v(i-1), unused...]
    // where v0 < v1 < v2 ... < v(i-1)
    //
    // This holds true for step i = 0 (array of size one is sorted)
    // Again, k0 = 0, v0 = moveFrom.getInt(k0)
    setKeyValue(0, 0, moveFrom.getInt(0));

    // At each of the next steps, we grab a new key and walk back until we find first key that is
    // less than current, shifting key/value pairs if they are larger than current key.
    for (int i = 1; i < size; i++) {
      // this is our next key
      int current = moveFrom.getInt(i);

      // this loop will find correct position for it
      int j;

      // At this point, array is like this: [ k0, v0, k1, v1, k2, v2, ..., k(i-1), v(i-1), ... ]
      for (j = i - 1; j >= 0; j--) {
        if (moveFromToValue(j) < current) {
          break;
        }

        // value at index j is < current value, shift that value and its key
        setKeyValue(j + 1, moveFromToIndex(j), moveFromToValue(j));
      }

      setKeyValue(j + 1, i, current);
    }
  }

  /**
   * Returns index of ith key in array.
   */
  private static int k(int i) {
    return i * 2;
  }

  /**
   * Returns index of ith value in array.
   */
  private static int v(int i) {
    return i * 2 + 1;
  }

  private void setKeyValue(int index, int key, int value) {
    mMapping[k(index)] = key;
    mMapping[v(index)] = value;
  }

  private int moveFromToIndex(int index) {
    return mMapping[k(index)];
  }

  private int moveFromToValue(int index) {
    return mMapping[v(index)];
  }

  private static int moveToToIndex(int index) {
    return index;
  }

  private int moveToToValue(int index) {
    return Assertions.assumeNotNull(mMoveTo).getInt(index);
  }

  private void setSize(int newSize) {
    // reset references to null when shrinking to avoid memory leaks
    for (int i = newSize; i < mSize; ++i) {
      mChildren[i] = null;
    }

    mSize = newSize;
  }
}
