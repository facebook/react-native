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
  private AttachDetachListener[] mAttachDetachListeners = AttachDetachListener.EMPTY_ARRAY;

  private int mViewLeft;
  private int mViewTop;
  private int mViewRight;
  private int mViewBottom;
  private boolean mIsUpdated;

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
   * Returns true when this CSSNode tree needs to be re-laid out. If true, FlatUIImplementation
   * will request LayoutEngine to perform a layout pass to update node boundaries. This is used
   * to avoid unnecessary node updates.
   */
  /* package */ boolean needsLayout() {
    return isDirty();
  }

  /**
   * Returns true if there are updates to the node tree other than layout (such as a change in
   * background color) that would require StateBuilder to re-collect drawing state.
   */
  /* package */ boolean isUpdated() {
    return mIsUpdated;
  }

  /**
   * Marks the node tree as requiring or not requiring a StateBuilder pass to collect drawing state.
   */
  /* package */ void markUpdated(boolean isUpdated) {
    mIsUpdated = isUpdated;
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
   * Sets an array of AttachDetachListeners to call onAttach/onDetach when they are attached to or
   * detached from a View that this shadow node maps to.
   */
  /* package */ void setAttachDetachListeners(AttachDetachListener[] listeners) {
    mAttachDetachListeners = listeners;
  }

  /**
   * Returns an array of AttachDetachListeners associated with this shadow node.
   */
  /* package */ AttachDetachListener[] getAttachDetachListeners() {
    return mAttachDetachListeners;
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
