/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.view;

import javax.annotation.concurrent.NotThreadSafe;

import android.graphics.Rect;
import android.view.View;
import android.view.ViewParent;

import com.facebook.react.uimanager.CatalystStylesDiffMap;

/**
 * Provides implementation of common tasks for view and it's view manager supporting property
 * {@code removeClippedSubviews}.
 */
@NotThreadSafe
public class ReactClippingViewGroupHelper {

  public static final String PROP_REMOVE_CLIPPED_SUBVIEWS = "removeClippedSubviews";

  private static final Rect sHelperRect = new Rect();

  /**
   * Can be used by view that support {@code removeClippedSubviews} property to calculate area that
   * given {@param view} should be clipped to based on the clipping rectangle of it's parent in
   * case when parent is also set to clip it's children.
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
        sHelperRect.offset(-view.getLeft(), -view.getTop());
        view.getDrawingRect(outputRect);
        if (!outputRect.intersect(sHelperRect)) {
          // rectangles does not intersect -> we should write empty rect to output
          outputRect.setEmpty();
        }
        return;
      }
    }
    view.getDrawingRect(outputRect);
  }
}
