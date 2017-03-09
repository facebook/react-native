/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import java.util.Arrays;

import android.util.SparseIntArray;

/**
 * {@link DrawCommandManager} with vertical clipping (The view scrolls up and down).
 */
/* package */ final class VerticalDrawCommandManager extends ClippingDrawCommandManager {

  /* package */ VerticalDrawCommandManager(
      FlatViewGroup flatViewGroup,
      DrawCommand[] drawCommands) {
    super(flatViewGroup, drawCommands);
  }

  @Override
  int commandStartIndex() {
    int start = Arrays.binarySearch(mCommandMaxBottom, mClippingRect.top);
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
        mClippingRect.bottom);
    // We don't care whether we matched or not, but positive indices are helpful. The binary search
    // returns ~index in the case that it isn't a match, so reverse that here.
    return stop < 0 ? ~stop : stop;
  }

  @Override
  int regionStopIndex(float touchX, float touchY) {
    int stop = Arrays.binarySearch(mRegionMinTop, touchY + 0.0001f);
    // We don't care whether we matched or not, but positive indices are helpful. The binary search
    // returns ~index in the case that it isn't a match, so reverse that here.
    return stop < 0 ? ~stop : stop;
  }

  @Override
  boolean regionAboveTouch(int index, float touchX, float touchY) {
    return mRegionMaxBottom[index] < touchY;
  }

  /**
   * Populates the max and min arrays for a given set of node regions.
   *
   * This should never be called from the UI thread, as the reason it exists is to do work off the
   * UI thread.
   *
   * @param regions The regions that will eventually be mounted.
   * @param maxBottom  At each index i, the maximum bottom value of all regions at or below i.
   * @param minTop  At each index i, the minimum top value of all regions at or below i.
   */
  public static void fillMaxMinArrays(NodeRegion[] regions, float[] maxBottom, float[] minTop) {
    float last = 0;
    for (int i = 0; i < regions.length; i++) {
      last = Math.max(last, regions[i].getTouchableBottom());
      maxBottom[i] = last;
    }
    for (int i = regions.length - 1; i >= 0; i--) {
      last = Math.min(last, regions[i].getTouchableTop());
      minTop[i] = last;
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
   * @param maxBottom At each index i, the maximum bottom value of all draw commands at or below i.
   * @param minTop At each index i, the minimum top value of all draw commands at or below i.
   * @param drawViewIndexMap Mapping of ids to index position within the draw command array.
   */
  public static void fillMaxMinArrays(
      DrawCommand[] commands,
      float[] maxBottom,
      float[] minTop,
      SparseIntArray drawViewIndexMap) {
    float last = 0;
    // Loop through the DrawCommands, keeping track of the maximum we've seen if we only iterated
    // through items up to this position.
    for (int i = 0; i < commands.length; i++) {
      if (commands[i] instanceof DrawView) {
        DrawView drawView = (DrawView) commands[i];
        // These will generally be roughly sorted by id, so try to insert at the end if possible.
        drawViewIndexMap.append(drawView.reactTag, i);
        last = Math.max(last, drawView.mLogicalBottom);
      } else {
        last = Math.max(last, commands[i].getBottom());
      }
      maxBottom[i] = last;
    }
    // Intentionally leave last as it was, since it's at the maximum bottom position we've seen so
    // far, we can use it again.

    // Loop through backwards, keeping track of the minimum we've seen at this position.
    for (int i = commands.length - 1; i >= 0; i--) {
      if (commands[i] instanceof DrawView) {
        last = Math.min(last, ((DrawView) commands[i]).mLogicalTop);
      } else {
        last = Math.min(last, commands[i].getTop());
      }
      minTop[i] = last;
    }
  }
}
