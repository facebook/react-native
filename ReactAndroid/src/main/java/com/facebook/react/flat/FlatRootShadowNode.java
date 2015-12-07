/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

/**
 * Root node of the shadow node hierarchy. Currently, the only node that can actually map to a View.
 */
/* package */ final class FlatRootShadowNode extends FlatShadowNode {

  private DrawCommand[] mDrawCommands = DrawCommand.EMPTY_ARRAY;

  private int mViewLeft;
  private int mViewTop;
  private int mViewRight;
  private int mViewBottom;

  @Override
  public int getScreenX() {
    return mViewLeft;
  }

  @Override
  public int getScreenY() {
    return mViewTop;
  }

  @Override
  public int getScreenWidth() {
    return mViewRight - mViewLeft;
  }

  @Override
  public int getScreenHeight() {
    return mViewBottom - mViewTop;
  }

  /**
   * Returns an array of DrawCommands to perform during the View's draw pass.
   */
  /* package */ DrawCommand[] getDrawCommands() {
    return mDrawCommands;
  }

  /**
   * Sets an array of DrawCommands to perform during the View's draw pass. StateBuilder uses old
   * draw commands to compare to new draw commands and see if the View neds to be redrawn.
   */
  /* package */ void setDrawCommands(DrawCommand[] drawCommands) {
    mDrawCommands = drawCommands;
  }

  /**
   * Sets boundaries of the View that this node maps to relative to the parent left/top coordinate.
   */
  /* package */ void setViewBounds(int left, int top, int right, int bottom) {
    mViewLeft = left;
    mViewTop = top;
    mViewRight = right;
    mViewBottom = bottom;
  }

  /**
   * Left position of the View this node maps to relative to the parent View.
   */
  /* package */ int getViewLeft() {
    return mViewLeft;
  }

  /**
   * Top position of the View this node maps to relative to the parent View.
   */
  /* package */ int getViewTop() {
    return mViewTop;
  }

  /**
   * Right position of the View this node maps to relative to the parent View.
   */
  /* package */ int getViewRight() {
    return mViewRight;
  }

  /**
   * Bottom position of the View this node maps to relative to the parent View.
   */
  /* package */ int getViewBottom() {
    return mViewBottom;
  }
}
