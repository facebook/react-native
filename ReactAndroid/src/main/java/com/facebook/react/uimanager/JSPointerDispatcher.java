/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.PointerEvent;
import com.facebook.react.uimanager.events.PointerEventHelper;
import com.facebook.react.uimanager.events.TouchEvent;
import com.facebook.react.uimanager.events.TouchEventCoalescingKeyHelper;

/**
 * JSPointerDispatcher handles dispatching pointer events to JS from RootViews. If you implement
 * RootView you need to call handleMotionEvent from onTouchEvent, onInterceptTouchEvent,
 * onHoverEvent, onInterceptHoverEvent. It will correctly find the right view to handle the touch
 * and also dispatch the appropriate event to JS
 */
public class JSPointerDispatcher {

  private final float[] mTargetCoordinates = new float[2];
  private int mChildHandlingNativeGesture = -1;
  private long mDownStartTime = TouchEvent.UNSET;
  private final ViewGroup mRootViewGroup;
  private final TouchEventCoalescingKeyHelper mTouchEventCoalescingKeyHelper =
      new TouchEventCoalescingKeyHelper();

  public JSPointerDispatcher(ViewGroup viewGroup) {
    mRootViewGroup = viewGroup;
  }

  public void onChildStartedNativeGesture(
      View childView, MotionEvent motionEvent, EventDispatcher eventDispatcher) {
    if (mChildHandlingNativeGesture != -1 || childView == null) {
      // This means we previously had another child start handling this native gesture and now a
      // different native parent of that child has decided to intercept the touch stream and handle
      // the gesture itself. Example where this can happen: HorizontalScrollView in a ScrollView.
      return;
    }

    int targetTag = findTargetTagAndSetCoordinates(motionEvent);
    dispatchCancelEvent(targetTag, motionEvent, eventDispatcher);
    mChildHandlingNativeGesture = childView.getId();
  }

  public void onChildEndedNativeGesture() {
    // There should be only one child gesture at any given time. We can safely turn off the flag.
    mChildHandlingNativeGesture = -1;
  }

  public void handleMotionEvent(MotionEvent motionEvent, EventDispatcher eventDispatcher) {

    // Ignore if child is handling native gesture
    if (mChildHandlingNativeGesture != -1) {
      return;
    }

    boolean supportsHover =
        PointerEventHelper.supportsHover(motionEvent.getToolType(motionEvent.getActionIndex()));

    int surfaceId = UIManagerHelper.getSurfaceId(mRootViewGroup);
    int action = motionEvent.getActionMasked();
    int targetTag = findTargetTagAndSetCoordinates(motionEvent);

    // First down pointer
    if (action == MotionEvent.ACTION_DOWN) {

      // Start a "down" coalescing key
      mDownStartTime = motionEvent.getEventTime();
      mTouchEventCoalescingKeyHelper.addCoalescingKey(mDownStartTime);

      if (!supportsHover) {
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.POINTER_ENTER, surfaceId, targetTag, motionEvent));
      }
      eventDispatcher.dispatchEvent(
          PointerEvent.obtain(PointerEventHelper.POINTER_DOWN, surfaceId, targetTag, motionEvent));

      return;
    }

    // New pointer goes down, this can only happen after ACTION_DOWN is sent for the first pointer
    if (action == MotionEvent.ACTION_POINTER_DOWN) {
      mTouchEventCoalescingKeyHelper.incrementCoalescingKey(mDownStartTime);

      if (!supportsHover) {
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.POINTER_ENTER, surfaceId, targetTag, motionEvent));
      }
      eventDispatcher.dispatchEvent(
          PointerEvent.obtain(PointerEventHelper.POINTER_DOWN, surfaceId, targetTag, motionEvent));

      return;
    }

    if (action == MotionEvent.ACTION_MOVE) {
      int coalescingKey = mTouchEventCoalescingKeyHelper.getCoalescingKey(mDownStartTime);
      eventDispatcher.dispatchEvent(
          PointerEvent.obtain(
              PointerEventHelper.POINTER_MOVE, surfaceId, targetTag, motionEvent, coalescingKey));
      return;
    }

    // Exactly one of the pointers goes up, not the last one
    if (action == MotionEvent.ACTION_POINTER_UP) {
      mTouchEventCoalescingKeyHelper.incrementCoalescingKey(mDownStartTime);
      eventDispatcher.dispatchEvent(
          PointerEvent.obtain(PointerEventHelper.POINTER_UP, surfaceId, targetTag, motionEvent));

      return;
    }

    // Last pointer comes up
    if (action == MotionEvent.ACTION_UP) {

      // End of a "down" coalescing key
      mTouchEventCoalescingKeyHelper.removeCoalescingKey(mDownStartTime);
      mDownStartTime = TouchEvent.UNSET;

      eventDispatcher.dispatchEvent(
          PointerEvent.obtain(PointerEventHelper.POINTER_UP, surfaceId, targetTag, motionEvent));

      if (!supportsHover) {
        eventDispatcher.dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.POINTER_LEAVE, surfaceId, targetTag, motionEvent));
      }
      return;
    }

    if (action == MotionEvent.ACTION_CANCEL) {
      dispatchCancelEvent(targetTag, motionEvent, eventDispatcher);

      return;
    }

    FLog.w(
        ReactConstants.TAG,
        "Warning : Motion Event was ignored. Action="
            + action
            + " Target="
            + targetTag
            + " Supports Hover="
            + supportsHover);
  }

  private int findTargetTagAndSetCoordinates(MotionEvent ev) {
    // This method updates `mTargetCoordinates` with coordinates for the motion event.
    return TouchTargetHelper.findTargetTagAndCoordinatesForTouch(
        ev.getX(), ev.getY(), mRootViewGroup, mTargetCoordinates, null);
  }

  private void dispatchCancelEvent(
      int targetTag, MotionEvent motionEvent, EventDispatcher eventDispatcher) {
    // This means the gesture has already ended, via some other CANCEL or UP event. This is not
    // expected to happen very often as it would mean some child View has decided to intercept the
    // touch stream and start a native gesture only upon receiving the UP/CANCEL event.

    Assertions.assertCondition(
        mChildHandlingNativeGesture == -1,
        "Expected to not have already sent a cancel for this gesture");
    int surfaceId = UIManagerHelper.getSurfaceId(mRootViewGroup);

    Assertions.assertNotNull(eventDispatcher)
        .dispatchEvent(
            PointerEvent.obtain(
                PointerEventHelper.POINTER_CANCEL, surfaceId, targetTag, motionEvent));

    eventDispatcher.dispatchEvent(
        PointerEvent.obtain(PointerEventHelper.POINTER_LEAVE, surfaceId, targetTag, motionEvent));

    mTouchEventCoalescingKeyHelper.removeCoalescingKey(mDownStartTime);
    mDownStartTime = TouchEvent.UNSET;
  }
}
