/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.scroll;

import android.content.Context;
import android.view.MotionEvent;
import android.widget.HorizontalScrollView;

import com.facebook.react.uimanager.MeasureSpecAssertions;
import com.facebook.react.uimanager.events.NativeGestureUtil;

/**
 * Similar to {@link ReactScrollView} but only supports horizontal scrolling.
 */
public class ReactHorizontalScrollView extends PagingHorizontalScrollView {

  private final OnScrollDispatchHelper mOnScrollDispatchHelper = new OnScrollDispatchHelper();
  private boolean mScrollEnabled = true;

  public ReactHorizontalScrollView(Context context) {
    super(context);
  }

  public void setScrollEnabled(boolean scrollEnabled) {
    mScrollEnabled = scrollEnabled;
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    MeasureSpecAssertions.assertExplicitMeasureSpec(widthMeasureSpec, heightMeasureSpec);

    setMeasuredDimension(
        MeasureSpec.getSize(widthMeasureSpec),
        MeasureSpec.getSize(heightMeasureSpec));
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    // Call with the present values in order to re-layout if necessary
    scrollTo(getScrollX(), getScrollY());
  }

  @Override
  protected void onScrollChanged(int x, int y, int oldX, int oldY) {
    super.onScrollChanged(x, y, oldX, oldY);

    if (mOnScrollDispatchHelper.onScrollChanged(x, y)) {
      ReactScrollViewHelper.emitScrollEvent(this, x, y);
    }
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    if (!mScrollEnabled) {
      return false;
    }
    if (super.onInterceptTouchEvent(ev)) {
      NativeGestureUtil.notifyNativeGestureStarted(this, ev);
      return true;
    }

    return false;
  }

  @Override
  public boolean onTouchEvent(MotionEvent ev) {
    switch (ev.getAction()) {
      case MotionEvent.ACTION_DOWN:
        if (mScrollEnabled) {
          return super.onTouchEvent(ev);
        }
        return mScrollEnabled;
      default:
        return super.onTouchEvent(ev);
    }
  }

}
