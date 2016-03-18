/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.modal;

import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.Point;
import android.view.Display;
import android.view.Surface;
import android.view.WindowManager;

import com.facebook.react.uimanager.LayoutShadowNode;

/**
 * We implement the Modal by using an Android Dialog. That will fill the entire window of the
 * application.  To get layout to work properly, we need to layout all the elements within the
 * Modal as if they can fill the entire window.  To do that, we need to explicitly set the
 * styleWidth and styleHeight on the LayoutShadowNode to be the window size.  This will then cause
 * the children to layout as if they can fill the window.
 *
 * To get that we use information from the WindowManager and default Display.  We don't use
 * DisplayMetricsHolder because it returns values that include the status bar.  We only want the
 * values of what will actually be shown on screen.
 */
class ModalHostShadowNode extends LayoutShadowNode {

  private final Point mMinPoint = new Point();
  private final Point mMaxPoint = new Point();
  /**
   * Once we have all the properties for the we need to measure the window and set the style
   * width and height appropriately so that layout is done properly for the view assuming it
   * fills the entire window instead of the place it is in the view tree
   */
  @Override
  @TargetApi(16)
  public void onAfterUpdateTransaction() {
    super.onAfterUpdateTransaction();

    Context context = getThemedContext();
    WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
    Display display = wm.getDefaultDisplay();
    // getCurrentSizeRange will return the min and max width and height that the window can be
    display.getCurrentSizeRange(mMinPoint, mMaxPoint);

    int width, height;
    int rotation = display.getRotation();
    if (rotation == Surface.ROTATION_0 || rotation == Surface.ROTATION_180) {
      // If we are vertical the width value comes from min width and height comes from max height
      width = mMinPoint.x;
      height = mMaxPoint.y;
    } else {
      // If we are horizontal the width value comes from max width and height comes from min height
      width = mMaxPoint.x;
      height = mMinPoint.y;
    }
    setStyleWidth(width);
    setStyleHeight(height);
  }
}
