/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.graphics.Rect;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;

/**
 * Node for a react View.
 */
/* package */ final class RCTView extends FlatShadowNode {
  private static final int[] SPACING_TYPES = {
      Spacing.ALL, Spacing.LEFT, Spacing.RIGHT, Spacing.TOP, Spacing.BOTTOM,
  };

  private @Nullable DrawBorder mDrawBorder;

  boolean mRemoveClippedSubviews;
  boolean mHorizontal;

  private @Nullable Rect mHitSlop;

  @Override
  /* package */ void handleUpdateProperties(ReactStylesDiffMap styles) {
    mRemoveClippedSubviews = mRemoveClippedSubviews ||
        (styles.hasKey(PROP_REMOVE_CLIPPED_SUBVIEWS) &&
            styles.getBoolean(PROP_REMOVE_CLIPPED_SUBVIEWS, false));

    if (mRemoveClippedSubviews) {
      mHorizontal = mHorizontal ||
          (styles.hasKey(PROP_HORIZONTAL) && styles.getBoolean(PROP_HORIZONTAL, false));
    }

    super.handleUpdateProperties(styles);
  }

  @Override
  protected void collectState(
      StateBuilder stateBuilder,
      float left,
      float top,
      float right,
      float bottom,
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    super.collectState(
        stateBuilder,
        left,
        top,
        right,
        bottom,
        clipLeft,
        clipTop,
        clipRight,
        clipBottom);

    if (mDrawBorder != null) {
      mDrawBorder = (DrawBorder) mDrawBorder.updateBoundsAndFreeze(
          left,
          top,
          right,
          bottom,
          clipLeft,
          clipTop,
          clipRight,
          clipBottom);
      stateBuilder.addDrawCommand(mDrawBorder);
    }
  }

  @Override
  boolean doesDraw() {
    return mDrawBorder != null || super.doesDraw();
  }

  @Override
  public void setBackgroundColor(int backgroundColor) {
    getMutableBorder().setBackgroundColor(backgroundColor);
  }

  @Override
  public void setBorderWidths(int index, float borderWidth) {
    super.setBorderWidths(index, borderWidth);

    int type = SPACING_TYPES[index];
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
    int type = SPACING_TYPES[index];
    if (Double.isNaN(color)) {
      getMutableBorder().resetBorderColor(type);
    } else {
      getMutableBorder().setBorderColor(type, (int) color);
    }
  }

  @ReactProp(name = "borderRadius")
  public void setBorderRadius(float borderRadius) {
    mClipRadius = borderRadius;
    if (mClipToBounds && borderRadius > DrawView.MINIMUM_ROUNDED_CLIPPING_VALUE) {
      // mount to a view if we are overflow: hidden and are clipping, so that we can do one
      // clipPath to clip all the children of this node (both DrawCommands and Views).
      forceMountToView();
    }
    getMutableBorder().setBorderRadius(PixelUtil.toPixelFromDIP(borderRadius));
  }

  @ReactProp(name = "borderStyle")
  public void setBorderStyle(@Nullable String borderStyle) {
    getMutableBorder().setBorderStyle(borderStyle);
  }

  @ReactProp(name = "hitSlop")
  public void setHitSlop(@Nullable ReadableMap hitSlop) {
    if (hitSlop == null) {
      mHitSlop = null;
    } else {
      mHitSlop = new Rect(
          (int) PixelUtil.toPixelFromDIP(hitSlop.getDouble("left")),
          (int) PixelUtil.toPixelFromDIP(hitSlop.getDouble("top")),
          (int) PixelUtil.toPixelFromDIP(hitSlop.getDouble("right")),
          (int) PixelUtil.toPixelFromDIP(hitSlop.getDouble("bottom")));
    }
  }

  @ReactProp(name = "pointerEvents")
  public void setPointerEvents(@Nullable String pointerEventsStr) {
    forceMountToView();
  }

  @Override
  /* package */ void updateNodeRegion(
      float left,
      float top,
      float right,
      float bottom,
      boolean isVirtual) {
    if (!getNodeRegion().matches(left, top, right, bottom, isVirtual)) {
      setNodeRegion(mHitSlop == null ?
          new NodeRegion(left, top, right, bottom, getReactTag(), isVirtual) :
          new HitSlopNodeRegion(mHitSlop, left, top, right, bottom, getReactTag(), isVirtual));
    }
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

  @Override
  public boolean clipsSubviews() {
    return mRemoveClippedSubviews;
  }
}
