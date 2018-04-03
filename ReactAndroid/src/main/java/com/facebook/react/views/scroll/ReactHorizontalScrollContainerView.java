// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.scroll;

import android.content.Context;
import android.view.ViewGroup;
import android.widget.HorizontalScrollView;
import com.facebook.react.modules.i18nmanager.I18nUtil;

/** Container of Horizontal scrollViews that supports RTL scrolling. */
public class ReactHorizontalScrollContainerView extends ViewGroup {

  private int mLayoutDirection;

  public ReactHorizontalScrollContainerView(Context context) {
    super(context);
    mLayoutDirection =
        I18nUtil.getInstance().isRTL(context) ? LAYOUT_DIRECTION_RTL : LAYOUT_DIRECTION_LTR;
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

      // Fix the ScrollX position when using RTL language
      int offsetX = computeHorizontalScrollRange() - getScrollX();

      // Call with the present values in order to re-layout if necessary
      HorizontalScrollView parent = (HorizontalScrollView) getParent();
      parent.scrollTo(offsetX, parent.getScrollY());
    }
  }
}
