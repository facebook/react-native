/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

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
  public void execute(MountingManager mountingManager) {
    mountingManager.removeViewAt(mParentReactTag, mIndex);
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
