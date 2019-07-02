/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import android.annotation.TargetApi;
import android.os.Build;
import android.util.LayoutDirection;
import com.facebook.react.fabric.mounting.MountingManager;

public class UpdateLayoutMountItem implements MountItem {

  private final int mReactTag;
  private final int mX;
  private final int mY;
  private final int mWidth;
  private final int mHeight;
  private final int mLayoutDirection;

  public UpdateLayoutMountItem(
      int reactTag, int x, int y, int width, int height, int layoutDirection) {
    mReactTag = reactTag;
    mX = x;
    mY = y;
    mWidth = width;
    mHeight = height;
    mLayoutDirection = convertLayoutDirection(layoutDirection);
  }

  @TargetApi(Build.VERSION_CODES.KITKAT)
  private int convertLayoutDirection(int layoutDirection) {
    switch (layoutDirection) {
      case 0:
        return LayoutDirection.INHERIT;
      case 1:
        return LayoutDirection.LTR;
      case 2:
        return LayoutDirection.RTL;
      default:
        throw new IllegalArgumentException("Unsupported layout direction: " + layoutDirection);
    }
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

  public int getLayoutDirection() {
    return mLayoutDirection;
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
        + mWidth
        + " - layoutDirection: "
        + +mLayoutDirection;
  }
}
