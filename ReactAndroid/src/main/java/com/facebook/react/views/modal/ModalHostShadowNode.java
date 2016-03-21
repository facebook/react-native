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

import com.facebook.csslayout.CSSNode;
import com.facebook.react.uimanager.LayoutShadowNode;

/**
 * We implement the Modal by using an Android Dialog. That will fill the entire window of the
 * application.  To get layout to work properly, we need to layout all the elements within the
 * Modal's inner content view as if they can fill the entire window.  To do that, we need to
 * explicitly set the styleWidth and styleHeight on the LayoutShadowNode of the child of this node
 * to be the window size.  This will then cause the children of the Modal to layout as if they can
 * fill the window.
 *
 * To get that we use information from the WindowManager and default Display.  We don't use
 * DisplayMetricsHolder because it returns values that include the status bar.  We only want the
 * values of what will actually be shown on screen.
 */
class ModalHostShadowNode extends LayoutShadowNode {

  private final Point mMinPoint = new Point();
  private final Point mMaxPoint = new Point();

  /**
   * We need to set the styleWidth and styleHeight of the one child (represented by the <View/>
   * within the <RCTModalHostView/> in Modal.js.  This needs to fill the entire window.
   */
  @Override
  @TargetApi(16)
  public void addChildAt(CSSNode child, int i) {
    super.addChildAt(child, i);

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
    child.setStyleWidth(width);
    child.setStyleHeight(height);
  }
}
