/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import android.content.Context;
import androidx.core.view.ViewCompat;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.views.view.ReactViewGroup;

/** Container of Horizontal scrollViews that supports RTL scrolling. */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactHorizontalScrollContainerView extends ReactViewGroup {

  private int mLayoutDirection;

  public ReactHorizontalScrollContainerView(Context context) {
    super(context);
    mLayoutDirection =
        I18nUtil.getInstance().isRTL(context)
            ? ViewCompat.LAYOUT_DIRECTION_RTL
            : ViewCompat.LAYOUT_DIRECTION_LTR;
  }

  @Override
  public int getLayoutDirection() {
    if (ReactNativeFeatureFlags.setAndroidLayoutDirection()) {
      return super.getLayoutDirection();
    }
    return mLayoutDirection;
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    if (getLayoutDirection() == LAYOUT_DIRECTION_RTL) {
      // When the layout direction is RTL, we expect Yoga to give us a layout
      // that extends off the screen to the left so we re-center it with left=0
      int newLeft = 0;
      int width = right - left;
      int newRight = newLeft + width;
      setLeft(newLeft);
      setTop(top);
      setRight(newRight);
      setBottom(bottom);
    }
  }
}
