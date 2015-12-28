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
public class ReactHorizontalScrollView extends HorizontalScrollView {

  private final OnScrollDispatchHelper mOnScrollDispatchHelper = new OnScrollDispatchHelper();

  private boolean mSendMomentumEvents;
  private boolean mDragging;
  private boolean mFlinging;
  private boolean mDoneFlinging;

  public ReactHorizontalScrollView(Context context) {
    super(context);
  }

  public void setSendMomentumEvents(boolean sendMomentumEvents) {
    mSendMomentumEvents = sendMomentumEvents;
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
      if (mFlinging) {
        mDoneFlinging = false;
      }
      ReactScrollViewHelper.emitScrollEvent(this);
    }
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    if (super.onInterceptTouchEvent(ev)) {
      NativeGestureUtil.notifyNativeGestureStarted(this, ev);
      ReactScrollViewHelper.emitScrollBeginDragEvent(this);
      mDragging = true;
      return true;
    }

    return false;
  }

  @Override
  public boolean onTouchEvent(MotionEvent ev) {
    int action = ev.getAction() & MotionEvent.ACTION_MASK;
    if (action == MotionEvent.ACTION_UP && mDragging) {
      ReactScrollViewHelper.emitScrollEndDragEvent(this);
      mDragging = false;
    }
    return super.onTouchEvent(ev);
  }

  @Override
  public void fling(int velocityX) {
    super.fling(velocityX);
    if (mSendMomentumEvents) {
      mFlinging = true;
      ReactScrollViewHelper.emitScrollMomentumBeginEvent(this);
      Runnable r = new Runnable() {
        @Override
        public void run() {
          if (mDoneFlinging) {
            mFlinging = false;
            ReactScrollViewHelper.emitScrollMomentumEndEvent(ReactHorizontalScrollView.this);
          } else {
            mDoneFlinging = true;
            ReactHorizontalScrollView.this.postOnAnimationDelayed(this, ReactScrollViewHelper.MOMENTUM_DELAY);
          }
        }
      };
      postOnAnimationDelayed(r, ReactScrollViewHelper.MOMENTUM_DELAY);
    }
  }
}
