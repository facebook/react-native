// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.views.modal;

import android.content.Context;
import android.content.res.Resources;
import android.content.res.TypedArray;
import android.graphics.Point;
import android.view.Display;
import android.view.WindowManager;
import com.facebook.infer.annotation.Assertions;

/** Helper class for Modals. */
/*package*/ class ModalHostHelper {

  private static final Point MIN_POINT = new Point();
  private static final Point MAX_POINT = new Point();
  private static final Point SIZE_POINT = new Point();

  /**
   * To get the size of the screen, we use information from the WindowManager and default Display.
   * We don't use DisplayMetricsHolder, or Display#getSize() because they return values that include
   * the status bar. We only want the values of what will actually be shown on screen. We use
   * Display#getSize() to determine if the screen is in portrait or landscape. We don't use
   * getRotation because the 'natural' rotation will be portrait on phones and landscape on tablets.
   * This should only be called on the native modules/shadow nodes thread.
   */
  public static Point getModalHostSize(Context context) {
    WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
    Display display = Assertions.assertNotNull(wm).getDefaultDisplay();
    // getCurrentSizeRange will return the min and max width and height that the window can be
    display.getCurrentSizeRange(MIN_POINT, MAX_POINT);
    // getSize will return the dimensions of the screen in its current orientation
    display.getSize(SIZE_POINT);

    int[] attrs = {android.R.attr.windowFullscreen};
    Resources.Theme theme = context.getTheme();
    TypedArray ta = theme.obtainStyledAttributes(attrs);
    boolean windowFullscreen = ta.getBoolean(0, false);

    // We need to add the status bar height to the height if we have a fullscreen window,
    // because Display.getCurrentSizeRange doesn't include it.
    Resources resources = context.getResources();
    int statusBarId = resources.getIdentifier("status_bar_height", "dimen", "android");
    int statusBarHeight = 0;
    if (windowFullscreen && statusBarId > 0) {
      statusBarHeight = (int) resources.getDimension(statusBarId);
    }

    if (SIZE_POINT.x < SIZE_POINT.y) {
      // If we are vertical the width value comes from min width and height comes from max height
      return new Point(MIN_POINT.x, MAX_POINT.y + statusBarHeight);
    } else {
      // If we are horizontal the width value comes from max width and height comes from min height
      return new Point(MAX_POINT.x, MIN_POINT.y + statusBarHeight);
    }
  }
}
