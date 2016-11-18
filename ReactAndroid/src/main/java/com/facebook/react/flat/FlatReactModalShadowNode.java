/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.Point;
import android.view.Display;
import android.view.Surface;
import android.view.WindowManager;

import com.facebook.react.uimanager.ReactShadowNode;

/**
 * FlatReactModalShadowNode
 *
 * This is a Nodes specific shadow node for modals. This is required because we wrap any
 * non-FlatShadowNode node in a NativeViewWrapper. In the case of a modal shadow node, we need
 * to treat it as its own node so that we can add the custom measurement behavior that is there
 * in the non-Nodes version when we add a child.
 *
 * {@see {@link com.facebook.react.views.modal.ModalHostShadowNode}}
 */
class FlatReactModalShadowNode extends FlatShadowNode implements AndroidView {

  private final Point mMinPoint = new Point();
  private final Point mMaxPoint = new Point();
  private boolean mPaddingChanged;

  FlatReactModalShadowNode() {
    forceMountToView();
    forceMountChildrenToView();
  }

  /**
   * We need to set the styleWidth and styleHeight of the one child (represented by the <View/>
   * within the <RCTModalHostView/> in Modal.js.  This needs to fill the entire window.
   */
  @Override
  @TargetApi(16)
  public void addChildAt(ReactShadowNode child, int i) {
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

  @Override
  public boolean needsCustomLayoutForChildren() {
    return false;
  }

  @Override
  public boolean isPaddingChanged() {
    return mPaddingChanged;
  }

  @Override
  public void resetPaddingChanged() {
    mPaddingChanged = false;
  }

  @Override
  public void setPadding(int spacingType, float padding) {
    if (getPadding(spacingType) != padding) {
      super.setPadding(spacingType, padding);
      mPaddingChanged = true;
      markUpdated();
    }
  }
}
