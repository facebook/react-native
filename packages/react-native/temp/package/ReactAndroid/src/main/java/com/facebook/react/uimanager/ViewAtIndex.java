/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import java.util.Comparator;

/**
 * Data structure that couples view tag to it's index in parent view. Used for managing children
 * operation.
 */
public class ViewAtIndex {
  public static Comparator<ViewAtIndex> COMPARATOR =
      new Comparator<ViewAtIndex>() {
        @Override
        public int compare(ViewAtIndex lhs, ViewAtIndex rhs) {
          return lhs.mIndex - rhs.mIndex;
        }
      };

  public final int mTag;
  public final int mIndex;

  public ViewAtIndex(int tag, int index) {
    mTag = tag;
    mIndex = index;
  }

  @Override
  public boolean equals(Object obj) {
    if (obj == null || obj.getClass() != getClass()) {
      return false;
    }
    ViewAtIndex other = (ViewAtIndex) obj;
    return mIndex == other.mIndex && mTag == other.mTag;
  }

  @Override
  public String toString() {
    return "[" + mTag + ", " + mIndex + "]";
  }
}
