/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.graphics.Rect;
import android.view.View;
import android.view.ViewParent;
import com.facebook.infer.annotation.Nullsafe;
import javax.annotation.concurrent.NotThreadSafe;

/**
 * Provides implementation of common tasks for view and it's view manager supporting property {@code
 * removeClippedSubviews}.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
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
            view.getLeft(),
            view.getTop() + (int) view.getTranslationY(),
            view.getRight(),
            view.getBottom() + (int) view.getTranslationY())) {
          outputRect.setEmpty();
          return;
        }
        // Now we move the coordinates to the View's coordinate space
        sHelperRect.offset(-view.getLeft(), -view.getTop());
        sHelperRect.offset(-(int) view.getTranslationX(), -(int) view.getTranslationY());
        sHelperRect.offset(view.getScrollX(), view.getScrollY());
        outputRect.set(sHelperRect);
        return;
      }
    }
    view.getDrawingRect(outputRect);
  }
}
