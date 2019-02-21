/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.MountingManager;

public class UpdateLayoutMountItem implements MountItem {

  private final int mReactTag;
  private final int mX;
  private final int mY;
  private final int mWidth;
  private final int mHeight;

  public UpdateLayoutMountItem(int reactTag, int x, int y, int width, int height) {
    mReactTag = reactTag;
    mX = x;
    mY = y;
    mWidth = width;
    mHeight = height;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    mountingManager.updateLayout(mReactTag, mX, mY, mWidth, mHeight);
  }

  public int getX() {
    return mX;
  }

  public int getY() {
    return mY;
  }

  public int getHeight() {
    return mHeight;
  }

  public int getWidth() {
    return mWidth;
  }

  @Override
  public String toString() {
    return "UpdateLayoutMountItem ["
        + mReactTag
        + "] - x: "
        + mX
        + " - y: "
        + mY
        + " - height: "
        + mHeight
        + " - width: "
        + mWidth;
  }
}
