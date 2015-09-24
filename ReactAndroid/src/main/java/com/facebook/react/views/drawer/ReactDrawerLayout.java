/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.drawer;

import android.support.v4.widget.DrawerLayout;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.PixelUtil;
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
    if (super.onInterceptTouchEvent(ev)) {
      NativeGestureUtil.notifyNativeGestureStarted(this, ev);
      return true;
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

  /* package */ void setDrawerWidth(int drawerWidth) {
    mDrawerWidth = (int) PixelUtil.toPixelFromDIP((float) drawerWidth);
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
