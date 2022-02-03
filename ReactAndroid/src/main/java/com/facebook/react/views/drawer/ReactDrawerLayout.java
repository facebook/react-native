/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.drawer;

import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import androidx.drawerlayout.widget.DrawerLayout;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.events.NativeGestureUtil;

/**
 * Wrapper view for {@link DrawerLayout}. It manages the properties that can be set on the drawer
 * and contains some ReactNative-specific functionality.
 */
/* package */ class ReactDrawerLayout extends DrawerLayout {

  public static final int DEFAULT_DRAWER_WIDTH = LayoutParams.MATCH_PARENT;
  private int mDrawerPosition = Gravity.START;
  private int mDrawerWidth = DEFAULT_DRAWER_WIDTH;

  public ReactDrawerLayout(ReactContext reactContext) {
    super(reactContext);
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    try {
      if (super.onInterceptTouchEvent(ev)) {
        NativeGestureUtil.notifyNativeGestureStarted(this, ev);
        return true;
      }
    } catch (IllegalArgumentException e) {
      // Log and ignore the error. This seems to be a bug in the android SDK and
      // this is the commonly accepted workaround.
      // https://tinyurl.com/mw6qkod (Stack Overflow)
      FLog.w(ReactConstants.TAG, "Error intercepting touch event.", e);
    }

    return false;
  }

  /* package */ void openDrawer() {
    openDrawer(mDrawerPosition);
  }

  /* package */ void closeDrawer() {
    closeDrawer(mDrawerPosition);
  }

  /* package */ void setDrawerPosition(int drawerPosition) {
    mDrawerPosition = drawerPosition;
    setDrawerProperties();
  }

  /* package */ void setDrawerWidth(int drawerWidthInPx) {
    mDrawerWidth = drawerWidthInPx;
    setDrawerProperties();
  }

  // Sets the properties of the drawer, after the navigationView has been set.
  /* package */ void setDrawerProperties() {
    if (this.getChildCount() == 2) {
      View drawerView = this.getChildAt(1);
      LayoutParams layoutParams = (LayoutParams) drawerView.getLayoutParams();
      layoutParams.gravity = mDrawerPosition;
      layoutParams.width = mDrawerWidth;
      drawerView.setLayoutParams(layoutParams);
      drawerView.setClickable(true);
    }
  }
}
