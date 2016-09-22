/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.graphics.Canvas;
import android.graphics.Rect;
import android.util.SparseArray;
import android.util.SparseIntArray;
import android.view.View;
import android.view.ViewParent;

/**
 * Underlying logic which handles draw commands, views and node regions when clipping in a
 * {@link FlatViewGroup}.
 */
/* package */ abstract class DrawCommandManager {

  /**
   * Mount a set of draw commands to this manager.  The order the commands are given is the order in
   * which they should be drawn.  If any of the commands are new DrawViews, then mountViews will be
   * called after by the UIManager.
   *
   * @param drawCommands The draw commands to mount.
   * @param drawViewIndexMap Mapping of ids to index position within the draw command array.
   * @param maxBottom At each index i, the maximum bottom value (or right value in the case of
   *   horizontal clipping) value of all draw commands at or below i.
   * @param minTop At each index i, the minimum top value (or left value in the case of horizontal
   *   clipping) value of all draw commands at or below i.
   * @param willMountViews Whether we are going to also receive a mountViews command in this state
   *   cycle.
   */
  abstract void mountDrawCommands(
      DrawCommand[] drawCommands,
      SparseIntArray drawViewIndexMap,
      float[] maxBottom,
      float[] minTop,
      boolean willMountViews);

  /**
   * Add and detach a set of views.  The views added here will already have a DrawView passed in
   * mountDrawCommands.
   *
   * @param viewResolver
   * @param viewsToAdd The views to add, by tag.  If this is a new view, this will be reactTag,
   *     otherwise it will be -reactTag.  This allows to optimize when we have already attached
   *     views.
   * @param viewsToDetach The views to detach, by tag.  These will all be positive.
   */
  abstract void mountViews(ViewResolver viewResolver, int[] viewsToAdd, int[] viewsToDetach);

  /**
   * Get the current clipping rect and adjust clipping so that when draw is dispatched we do as
   * little work as possible.
   *
   * @return true if the FlatViewGroup should invalidate.
   */
  abstract boolean updateClippingRect();

  /**
   * Sets an input rect to match the bounds of our current clipping rect.
   *
   * @param outClippingRect Set the out
   */
  abstract void getClippingRect(Rect outClippingRect);

  /**
   * Return the views that are currently detached, so they can be cleaned up when we are.
   *
   * @return A collection of the currently detached views.
   */
  abstract SparseArray<View> getDetachedViews();

  /**
   * Draw the relevant items.  This should do as little work as possible.
   *
   * @param canvas The canvas to draw on.
   */
  abstract void draw(Canvas canvas);

  /**
   * Draws layout bounds for debug.
   *
   * @param canvas The canvas to draw on.
   */
  abstract void debugDraw(Canvas canvas);

  /**
   * Mount node regions, which are the hit boxes of the shadow node children of this FlatViewGroup,
   * though some may not have a corresponding draw command.
   *
   * @param nodeRegions Array of node regions to mount.
   * @param maxBottom At each index i, the maximum bottom value (or right value in the case of
   *   horizontal clipping) value of all node regions at or below i.
   * @param minTop At each index i, the minimum top value (or left value in the case of horizontal
   *   clipping) value of all draw commands at or below i.
   */
  abstract void mountNodeRegions(NodeRegion[] nodeRegions, float[] maxBottom, float[] minTop);

  /**
   * Find a matching node region for a touch.
   *
   * @param touchX X coordinate of touch.
   * @param touchY Y coordinate of touch.
   * @return Matching node region, or null if none are found.
   */
  abstract @Nullable NodeRegion anyNodeRegionWithinBounds(float touchX, float touchY);

  /**
   * Find a matching virtual node region for a touch.
   *
   * @param touchX X coordinate of touch.
   * @param touchY Y coordinate of touch.
   * @return Matching node region, or null if none are found.
   */
  abstract @Nullable NodeRegion virtualNodeRegionWithinBounds(float touchX, float touchY);

  /**
   * Event that is fired when a clipped view is dropped.
   *
   * @param view the view that is dropped
   */
  abstract void onClippedViewDropped(View view);

  /**
   * Throw a runtime exception if a view we are trying to attach is already parented.
   *
   * @param view The view to check.
   */
  protected static void ensureViewHasNoParent(View view) {
    ViewParent oldParent = view.getParent();
    if (oldParent != null) {
      throw new RuntimeException(
          "Cannot add view " + view + " to DrawCommandManager while it has a parent " + oldParent);
    }
  }

  /**
   * Get a draw command manager that will clip vertically (The view scrolls up and down).
   *
   * @param flatViewGroup FlatViewGroup to use for drawing.
   * @param drawCommands List of commands to mount.
   * @return Vertically clipping draw command manager.
   */
  static DrawCommandManager getVerticalClippingInstance(
      FlatViewGroup flatViewGroup,
      DrawCommand[] drawCommands) {
    return new VerticalDrawCommandManager(flatViewGroup, drawCommands);
  }
}
