// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.views.scroll;

import android.content.Context;
import android.graphics.Rect;
import android.graphics.RectF;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.HorizontalScrollView;
import androidx.core.view.ViewCompat;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.ViewProps;

/** Container of Horizontal scrollViews that supports RTL scrolling. */
public class ReactHorizontalScrollContainerView extends ViewGroup {

  private int mLayoutDirection;
  private int mCurrentWidth;

  public ReactHorizontalScrollContainerView(Context context) {
    super(context);
    mLayoutDirection =
        I18nUtil.getInstance().isRTL(context)
            ? ViewCompat.LAYOUT_DIRECTION_RTL
            : ViewCompat.LAYOUT_DIRECTION_LTR;
    mCurrentWidth = 0;
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    if (mLayoutDirection == LAYOUT_DIRECTION_RTL) {
      // When the layout direction is RTL, we expect Yoga to give us a layout
      // that extends off the screen to the left so we re-center it with left=0
      int newLeft = 0;
      int width = right - left;
      int newRight = newLeft + width;
      setLeft(newLeft);
      setRight(newRight);

      // Call with the present values in order to re-layout if necessary
      HorizontalScrollView parent = (HorizontalScrollView) getParent();
      // Fix the ScrollX position when using RTL language
      int offsetX = parent.getScrollX() + getWidth() - mCurrentWidth;
      parent.scrollTo(offsetX, parent.getScrollY());
    }
    mCurrentWidth = getWidth();
  }

  @Override
  public boolean getChildVisibleRect(View child, Rect r, android.graphics.Point offset) {
    // This is based on the Android ViewGroup implementation, modified to clip child rects
    // if overflow is set to ViewProps.HIDDEN. This effectively solves Issue #23870 which
    // appears to have been introduced by FLAG_CLIP_CHILDREN being forced false
    // regardless of whether clipping is desired.
    final RectF rect = new RectF();
    rect.set(r);

    child.getMatrix().mapRect(rect);

    final int dx = child.getLeft() - getScrollX();
    int dy = child.getTop() - getScrollY();

    rect.offset(dx, dy);

    if (offset != null) {
      float[] position = new float[2];
      position[0] = offset.x;
      position[1] = offset.y;
      child.getMatrix().mapPoints(position);
      offset.x = Math.round(position[0]) + dx;
      offset.y = Math.round(position[1]) + dy;
    }

    final int width = getRight() - getLeft();
    final int height = getBottom() - getTop();

    boolean rectIsVisible = true;

    ViewParent parent = getParent();
    if (parent == null) {
      rectIsVisible = rect.intersect(0, 0, width, height);
    }

    r.set((int) Math.floor(rect.left), (int) Math.floor(rect.top),
      (int) Math.ceil(rect.right), (int) Math.ceil(rect.bottom));

    if (rectIsVisible && parent != null) {
      rectIsVisible = parent.getChildVisibleRect(this, r, offset);
    }
    return rectIsVisible;
  }
}
