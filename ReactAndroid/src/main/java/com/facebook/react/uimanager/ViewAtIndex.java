/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import java.util.Comparator;

/**
 * Data structure that couples view tag to it's index in parent view. Used for managing children
 * operation.
 */
/* package */ class ViewAtIndex {
  public static Comparator<ViewAtIndex> COMPARATOR = new Comparator<ViewAtIndex>() {
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
}
