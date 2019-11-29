/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.NonNull;
import com.facebook.react.fabric.mounting.MountingManager;

/**
 * A MountItem that represents setting the padding properties of a view (left, top, right, bottom).
 * This is distinct from layout because it happens far less frequently from layout; so it is a perf
 * optimization to transfer this data and execute the methods strictly less than the layout-related
 * properties.
 */
public class UpdatePaddingMountItem implements MountItem {

  private final int mReactTag;
  private final int mLeft;
  private final int mTop;
  private final int mRight;
  private final int mBottom;

  public UpdatePaddingMountItem(int reactTag, int left, int top, int right, int bottom) {
    mReactTag = reactTag;
    mLeft = left;
    mTop = top;
    mRight = right;
    mBottom = bottom;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    mountingManager.updatePadding(mReactTag, mLeft, mTop, mRight, mBottom);
  }

  @Override
  public String toString() {
    return "UpdatePaddingMountItem ["
        + mReactTag
        + "] - left: "
        + mLeft
        + " - top: "
        + mTop
        + " - right: "
        + mRight
        + " - bottom: "
        + mBottom;
  }
}
