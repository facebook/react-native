/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import java.util.Collection;

import android.graphics.Canvas;
import android.graphics.Rect;
import android.view.View;
import android.view.ViewParent;

/**
 * Underlying logic behind handling draw commands from {@link FlatViewGroup}.
 */
/* package */ abstract class DrawCommandManager {

  /**
   * Mount a set of draw commands to this manager.  The order the commands are given is the order in
   * which they should be drawn.  If any of the commands are new DrawViews, then mountViews will be
   * called after by the UIManager.
   *
   * @param drawCommands The draw commands to mount.
   */
  abstract void mountDrawCommands(DrawCommand[] drawCommands);

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
  abstract Collection<View> getDetachedViews();

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
}
