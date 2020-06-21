/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.NonNull;
import com.facebook.react.fabric.mounting.MountingManager;

public class RemoveMountItem implements MountItem {

  private int mReactTag;
  private int mParentReactTag;
  private int mIndex;

  public RemoveMountItem(int reactTag, int parentReactTag, int index) {
    mReactTag = reactTag;
    mParentReactTag = parentReactTag;
    mIndex = index;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    mountingManager.removeViewAt(-1, mParentReactTag, mIndex);
  }

  public int getParentReactTag() {
    return mParentReactTag;
  }

  public int getIndex() {
    return mIndex;
  }

  @Override
  public String toString() {
    return "RemoveMountItem ["
        + mReactTag
        + "] - parentTag: "
        + mParentReactTag
        + " - index: "
        + mIndex;
  }
}
