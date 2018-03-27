/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import java.util.Arrays;

import android.util.SparseIntArray;

/**
 * {@link DrawCommandManager} with horizontal clipping (The view scrolls left and right).
 */
/* package */ final class HorizontalDrawCommandManager extends ClippingDrawCommandManager {

  /* package */ HorizontalDrawCommandManager(
      FlatViewGroup flatViewGroup,
      DrawCommand[] drawCommands) {
    super(flatViewGroup, drawCommands);
  }

  @Override
  int commandStartIndex() {
    int start = Arrays.binarySearch(mCommandMaxBottom, mClippingRect.left);
    // We don't care whether we matched or not, but positive indices are helpful. The binary search
    // returns ~index in the case that it isn't a match, so reverse that here.
    return start < 0 ? ~start : start;
  }

  @Override
  int commandStopIndex(int start) {
    int stop = Arrays.binarySearch(
        mCommandMinTop,
        start,
        mCommandMinTop.length,
        mClippingRect.right);
    // We don't care whether we matched or not, but positive indices are helpful. The binary search
    // returns ~index in the case that it isn't a match, so reverse that here.
    return stop < 0 ? ~stop : stop;
  }

  @Override
  int regionStopIndex(float touchX, float touchY) {
    int stop = Arrays.binarySearch(mRegionMinTop, touchX + 0.0001f);
    // We don't care whether we matched or not, but positive indices are helpful. The binary search
    // returns ~index in the case that it isn't a match, so reverse that here.
    return stop < 0 ? ~stop : stop;
  }

  @Override
  boolean regionAboveTouch(int index, float touchX, float touchY) {
    return mRegionMaxBottom[index] < touchX;
  }

  /**
   * Populates the max and min arrays for a given set of node regions.
   *
   * This should never be called from the UI thread, as the reason it exists is to do work off the
   * UI thread.
   *
   * @param regions The regions that will eventually be mounted.
   * @param maxRight  At each index i, the maximum right value of all regions at or below i.
   * @param minLeft  At each index i, the minimum left value of all regions at or below i.
   */
  public static void fillMaxMinArrays(NodeRegion[] regions, float[] maxRight, float[] minLeft) {
    float last = 0;
    for (int i = 0; i < regions.length; i++) {
      last = Math.max(last, regions[i].getTouchableRight());
      maxRight[i] = last;
    }
    for (int i = regions.length - 1; i >= 0; i--) {
      last = Math.min(last, regions[i].getTouchableLeft());
      minLeft[i] = last;
    }
  }

  /**
   * Populates the max and min arrays for a given set of draw commands.  Also populates a mapping of
   * react tags to their index position in the command array.
   *
   * This should never be called from the UI thread, as the reason it exists is to do work off the
   * UI thread.
   *
   * @param commands The draw commands that will eventually be mounted.
   * @param maxRight At each index i, the maximum right value of all draw commands at or below i.
   * @param minLeft At each index i, the minimum left value of all draw commands at or below i.
   * @param drawViewIndexMap Mapping of ids to index position within the draw command array.
   */
  public static void fillMaxMinArrays(
      DrawCommand[] commands,
      float[] maxRight,
      float[] minLeft,
      SparseIntArray drawViewIndexMap) {
    float last = 0;
    // Loop through the DrawCommands, keeping track of the maximum we've seen if we only iterated
    // through items up to this position.
    for (int i = 0; i < commands.length; i++) {
      if (commands[i] instanceof DrawView) {
        DrawView drawView = (DrawView) commands[i];
        // These will generally be roughly sorted by id, so try to insert at the end if possible.
        drawViewIndexMap.append(drawView.reactTag, i);
        last = Math.max(last, drawView.mLogicalRight);
      } else {
        last = Math.max(last, commands[i].getRight());
      }
      maxRight[i] = last;
    }
    // Intentionally leave last as it was, since it's at the maximum bottom position we've seen so
    // far, we can use it again.

    // Loop through backwards, keeping track of the minimum we've seen at this position.
    for (int i = commands.length - 1; i >= 0; i--) {
      if (commands[i] instanceof DrawView) {
        last = Math.min(last, ((DrawView) commands[i]).mLogicalLeft);
      } else {
        last = Math.min(last, commands[i].getLeft());
      }
      minLeft[i] = last;
    }
  }
}
