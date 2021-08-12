/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import android.content.Context;
import androidx.core.view.ViewCompat;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.views.view.ReactViewGroup;

/** Container of Horizontal scrollViews that supports RTL scrolling. */
public class ReactHorizontalScrollContainerView extends ReactViewGroup {

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
  public void setRemoveClippedSubviews(boolean removeClippedSubviews) {
    // Clipping doesn't work well for horizontal scroll views in RTL mode - in both
    // Fabric and non-Fabric - especially with TextInputs. The behavior you could see
    // is TextInputs being blurred immediately after being focused. So, for now,
    // it's easier to just disable this for these specific RTL views.
    // TODO T86027499: support `setRemoveClippedSubviews` in RTL mode
    if (mLayoutDirection == LAYOUT_DIRECTION_RTL) {
      super.setRemoveClippedSubviews(false);
      return;
    }

    super.setRemoveClippedSubviews(removeClippedSubviews);
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

      /**
       * Note: in RTL mode, *when layout width changes*, we adjust the scroll position. Practically,
       * this means that on the first (meaningful) layout we will go from position 0 to position
       * (right - screenWidth). In theory this means if the width of the view ever changes during
       * layout again, scrolling could jump. Which shouldn't happen in theory, but... if you find a
       * weird product bug that looks related, keep this in mind.
       */
      if (mCurrentWidth != getWidth()) {
        // Call with the present values in order to re-layout if necessary
        ReactHorizontalScrollView parent = (ReactHorizontalScrollView) getParent();
        // Fix the ScrollX position when using RTL language
        int offsetX = parent.getScrollX() + getWidth() - mCurrentWidth - parent.getWidth();
        parent.scrollTo(offsetX, parent.getScrollY());
      }
    }
    mCurrentWidth = getWidth();
  }
}
