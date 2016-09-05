/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.swiperefresh;

import android.support.v4.widget.SwipeRefreshLayout;
import android.view.MotionEvent;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.events.NativeGestureUtil;
import com.facebook.react.uimanager.PixelUtil;

/**
 * Basic extension of {@link SwipeRefreshLayout} with ReactNative-specific functionality.
 */
public class ReactSwipeRefreshLayout extends SwipeRefreshLayout {

  private static final float DEFAULT_CIRCLE_TARGET = 64;

  private boolean mDidLayout = false;

  private boolean mRefreshing = false;
  private float mProgressViewOffset = 0;


  public ReactSwipeRefreshLayout(ReactContext reactContext) {
    super(reactContext);
  }

  @Override
  public void setRefreshing(boolean refreshing) {
    mRefreshing = refreshing;

    // `setRefreshing` must be called after the initial layout otherwise it
    // doesn't work when mounting the component with `refreshing = true`.
    // Known Android issue: https://code.google.com/p/android/issues/detail?id=77712
    if (mDidLayout) {
      super.setRefreshing(refreshing);
    }
  }

  public void setProgressViewOffset(float offset) {
    mProgressViewOffset = offset;

    // The view must be measured before calling `getProgressCircleDiameter` so
    // don't do it before the initial layout.
    if (mDidLayout) {
      int diameter = getProgressCircleDiameter();
      int start = Math.round(PixelUtil.toPixelFromDIP(offset)) - diameter;
      int end = Math.round(PixelUtil.toPixelFromDIP(offset + DEFAULT_CIRCLE_TARGET) - diameter);
      setProgressViewOffset(false, start, end);
    }
  }

  @Override
  public void onLayout(boolean changed, int left, int top, int right, int bottom) {
    super.onLayout(changed, left, top, right, bottom);

    if (!mDidLayout) {
      mDidLayout = true;

      // Update values that must be set after initial layout.
      setProgressViewOffset(mProgressViewOffset);
      setRefreshing(mRefreshing);
    }
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    if (super.onInterceptTouchEvent(ev)) {
      NativeGestureUtil.notifyNativeGestureStarted(this, ev);
      return true;
    }
    return false;
  }
}
