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

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.ReactPropGroup;
import com.facebook.react.uimanager.ViewProps;

/* package */ final class RCTView extends FlatShadowNode {

  private @Nullable DrawBorder mDrawBorder;

  @Override
  protected void collectState(
      StateBuilder stateBuilder,
      float left,
      float top,
      float right,
      float bottom) {
    super.collectState(stateBuilder, left, top, right, bottom);

    if (mDrawBorder != null) {
      mDrawBorder = (DrawBorder) mDrawBorder.updateBoundsAndFreeze(left, top, right, bottom);
      stateBuilder.addDrawCommand(mDrawBorder);
    }
  }

  @Override
  public void setBackgroundColor(int backgroundColor) {
    getMutableBorder().setBackgroundColor(backgroundColor);
  }

  @Override
  public void setBorderWidths(int index, float borderWidth) {
    super.setBorderWidths(index, borderWidth);

    int type = ViewProps.BORDER_SPACING_TYPES[index];
    getMutableBorder().setBorderWidth(type, PixelUtil.toPixelFromDIP(borderWidth));
  }

  @ReactProp(name = "nativeBackgroundAndroid")
  public void setHotspot(@Nullable ReadableMap bg) {
    if (bg != null) {
      forceMountToView();
    }
  }

  @ReactPropGroup(names = {
      "borderColor", "borderLeftColor", "borderRightColor", "borderTopColor", "borderBottomColor"
  }, customType = "Color", defaultDouble = Double.NaN)
  public void setBorderColor(int index, double color) {
    int type = ViewProps.BORDER_SPACING_TYPES[index];
    if (Double.isNaN(color)) {
      getMutableBorder().resetBorderColor(type);
    } else {
      getMutableBorder().setBorderColor(type, (int) color);
    }
  }

  @ReactProp(name = "borderRadius")
  public void setBorderRadius(float borderRadius) {
    getMutableBorder().setBorderRadius(PixelUtil.toPixelFromDIP(borderRadius));
  }

  @ReactProp(name = "borderStyle")
  public void setBorderStyle(@Nullable String borderStyle) {
    getMutableBorder().setBorderStyle(borderStyle);
  }

  private DrawBorder getMutableBorder() {
    if (mDrawBorder == null) {
      mDrawBorder = new DrawBorder();
    } else if (mDrawBorder.isFrozen()) {
      mDrawBorder = (DrawBorder) mDrawBorder.mutableCopy();
    }
    invalidate();
    return mDrawBorder;
  }
}
