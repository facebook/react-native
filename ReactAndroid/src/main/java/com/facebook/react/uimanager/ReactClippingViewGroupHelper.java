/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.graphics.Rect;
import android.graphics.RectF;
import android.view.View;
import android.view.ViewParent;
import javax.annotation.concurrent.NotThreadSafe;

/**
 * Provides implementation of common tasks for view and it's view manager supporting property {@code
 * removeClippedSubviews}.
 */
@NotThreadSafe
public class ReactClippingViewGroupHelper {

  public static final String PROP_REMOVE_CLIPPED_SUBVIEWS = "removeClippedSubviews";

  private static final Rect sHelperRect = new Rect();

  /**
   * Can be used by view that support {@code removeClippedSubviews} property to calculate area that
   * given {@param view} should be clipped to based on the clipping rectangle of it's parent in case
   * when parent is also set to clip it's children.
   *
   * @param view view that we want to calculate clipping rect for
   * @param outputRect where the calculated rectangle will be written
   */
  public static void calculateClippingRect(View view, Rect outputRect) {
    ViewParent parent = view.getParent();
    if (parent == null) {
      outputRect.setEmpty();
      return;
    } else if (parent instanceof ReactClippingViewGroup) {
      ReactClippingViewGroup clippingViewGroup = (ReactClippingViewGroup) parent;
      if (clippingViewGroup.getRemoveClippedSubviews()) {
        clippingViewGroup.getClippingRect(sHelperRect);
        // Intersect the view with the parent's rectangle
        // This will result in the overlap with coordinates in the parent space
        if (!sHelperRect.intersect(
            view.getLeft(), view.getTop(), view.getRight(), view.getBottom())) {
          outputRect.setEmpty();
          return;
        }
        // Now we move the coordinates to the View's coordinate space
        sHelperRect.offset(-view.getLeft(), -view.getTop());
        sHelperRect.offset(view.getScrollX(), view.getScrollY());
        outputRect.set(sHelperRect);
        return;
      }
    }
    view.getDrawingRect(outputRect);
  }

  public static boolean getChildVisibleRectHelper(
      View child, Rect r, android.graphics.Point offset, View parent, String overflow) {
    // This is based on the Android ViewGroup implementation, modified to clip child rects
    // if overflow is set to ViewProps.HIDDEN. This effectively solves Issue #23870 which
    // appears to have been introduced by FLAG_CLIP_CHILDREN being forced false
    // regardless of whether clipping is desired.
    final RectF rect = new RectF();
    rect.set(r);

    child.getMatrix().mapRect(rect);

    final int dx = child.getLeft() - parent.getScrollX();
    final int dy = child.getTop() - parent.getScrollY();

    rect.offset(dx, dy);

    if (offset != null) {
      float[] position = new float[2];
      position[0] = offset.x;
      position[1] = offset.y;
      child.getMatrix().mapPoints(position);
      offset.x = Math.round(position[0]) + dx;
      offset.y = Math.round(position[1]) + dy;
    }

    final int width = parent.getRight() - parent.getLeft();
    final int height = parent.getBottom() - parent.getTop();

    boolean rectIsVisible = true;

    ViewParent grandparent = parent.getParent();
    if (grandparent == null || ViewProps.HIDDEN.equals(overflow)) {
      rectIsVisible = rect.intersect(0, 0, width, height);
    }

    r.set(
        (int) Math.floor(rect.left),
        (int) Math.floor(rect.top),
        (int) Math.ceil(rect.right),
        (int) Math.ceil(rect.bottom));

    if (rectIsVisible && grandparent != null) {
      rectIsVisible = grandparent.getChildVisibleRect(parent, r, offset);
    }
    return rectIsVisible;
  }
}
