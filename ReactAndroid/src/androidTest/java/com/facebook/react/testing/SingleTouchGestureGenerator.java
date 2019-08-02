/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.testing;

import android.os.SystemClock;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import com.facebook.react.testing.idledetection.IdleWaiter;

/**
 * Provides methods for generating touch events and dispatching them directly to a given view.
 * Events scenarios are based on {@link android.test.TouchUtils} but they get gets dispatched
 * directly through the view hierarchy using {@link View#dispatchTouchEvent} method instead of using
 * instrumentation API.
 *
 * <p>All the events for a gesture are dispatched immediately which makes tests run very fast. The
 * eventTime for each event is still set correctly. Android's gesture recognizers check eventTime in
 * order to figure out gesture speed, and therefore scroll vs fling is recognized.
 */
public class SingleTouchGestureGenerator {

  private static final long DEFAULT_DELAY_MS = 20;

  private View mDispatcherView;
  private IdleWaiter mIdleWaiter;
  private long mLastDownTime;
  private long mEventTime;
  private float mLastX;
  private float mLastY;

  private ViewConfiguration mViewConfig;

  public SingleTouchGestureGenerator(View view, IdleWaiter idleWaiter) {
    mDispatcherView = view;
    mIdleWaiter = idleWaiter;
    mViewConfig = ViewConfiguration.get(view.getContext());
  }

  private SingleTouchGestureGenerator dispatchEvent(
      final int action, final float x, final float y, long eventTime) {
    mEventTime = eventTime;
    if (action == MotionEvent.ACTION_DOWN) {
      mLastDownTime = eventTime;
    }
    mLastX = x;
    mLastY = y;
    mDispatcherView.post(
        new Runnable() {
          @Override
          public void run() {
            MotionEvent event = MotionEvent.obtain(mLastDownTime, mEventTime, action, x, y, 0);
            mDispatcherView.dispatchTouchEvent(event);
            event.recycle();
          }
        });
    mIdleWaiter.waitForBridgeAndUIIdle();
    return this;
  }

  private float getViewCenterX(View view) {
    int[] xy = new int[2];
    view.getLocationOnScreen(xy);
    int viewWidth = view.getWidth();
    return xy[0] + (viewWidth / 2.0f);
  }

  private float getViewCenterY(View view) {
    int[] xy = new int[2];
    view.getLocationOnScreen(xy);
    int viewHeight = view.getHeight();
    return xy[1] + (viewHeight / 2.0f);
  }

  public SingleTouchGestureGenerator startGesture(float x, float y) {
    return dispatchEvent(MotionEvent.ACTION_DOWN, x, y, SystemClock.uptimeMillis());
  }

  public SingleTouchGestureGenerator startGesture(View view) {
    return startGesture(getViewCenterX(view), getViewCenterY(view));
  }

  private SingleTouchGestureGenerator dispatchDelayedEvent(
      int action, float x, float y, long delay) {
    return dispatchEvent(action, x, y, mEventTime + delay);
  }

  public SingleTouchGestureGenerator endGesture(float x, float y, long delay) {
    return dispatchDelayedEvent(MotionEvent.ACTION_UP, x, y, delay);
  }

  public SingleTouchGestureGenerator endGesture(float x, float y) {
    return endGesture(x, y, DEFAULT_DELAY_MS);
  }

  public SingleTouchGestureGenerator endGesture() {
    return endGesture(mLastX, mLastY);
  }

  public SingleTouchGestureGenerator moveGesture(float x, float y, long delay) {
    return dispatchDelayedEvent(MotionEvent.ACTION_MOVE, x, y, delay);
  }

  public SingleTouchGestureGenerator moveBy(float dx, float dy, long delay) {
    return moveGesture(mLastX + dx, mLastY + dy, delay);
  }

  public SingleTouchGestureGenerator moveBy(float dx, float dy) {
    return moveBy(dx, dy, DEFAULT_DELAY_MS);
  }

  public SingleTouchGestureGenerator clickViewAt(float x, float y) {
    float touchSlop = mViewConfig.getScaledTouchSlop();
    return startGesture(x, y).moveBy(touchSlop / 2.0f, touchSlop / 2.0f).endGesture();
  }

  public SingleTouchGestureGenerator drag(
      float fromX, float fromY, float toX, float toY, int stepCount, long totalDelay) {

    float xStep = (toX - fromX) / stepCount;
    float yStep = (toY - fromY) / stepCount;

    float x = fromX;
    float y = fromY;

    for (int i = 0; i < stepCount; i++) {
      x += xStep;
      y += yStep;
      moveGesture(x, y, totalDelay / stepCount);
    }
    return this;
  }

  public SingleTouchGestureGenerator dragTo(float toX, float toY, int stepCount, long totalDelay) {
    return drag(mLastX, mLastY, toX, toY, stepCount, totalDelay);
  }

  public SingleTouchGestureGenerator dragTo(View view, int stepCount, long totalDelay) {
    return dragTo(getViewCenterX(view), getViewCenterY(view), stepCount, totalDelay);
  }

  public SingleTouchGestureGenerator dragTo(View view, int stepCount) {
    return dragTo(view, stepCount, stepCount * DEFAULT_DELAY_MS);
  }
}
