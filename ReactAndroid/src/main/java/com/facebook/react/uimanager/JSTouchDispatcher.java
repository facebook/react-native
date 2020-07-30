/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.MotionEvent;
import android.view.ViewGroup;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.TouchEvent;
import com.facebook.react.uimanager.events.TouchEventCoalescingKeyHelper;
import com.facebook.react.uimanager.events.TouchEventType;

/**
 * JSTouchDispatcher handles dispatching touches to JS from RootViews. If you implement RootView you
 * need to call handleTouchEvent from onTouchEvent and onInterceptTouchEvent. It will correctly find
 * the right view to handle the touch and also dispatch the appropriate event to JS
 */
public class JSTouchDispatcher {

  private int mTargetTag = -1;
  private final float[] mTargetCoordinates = new float[2];
  private boolean mChildIsHandlingNativeGesture = false;
  private long mGestureStartTime = TouchEvent.UNSET;
  private final ViewGroup mRootViewGroup;
  private final TouchEventCoalescingKeyHelper mTouchEventCoalescingKeyHelper =
      new TouchEventCoalescingKeyHelper();
  private final float[] mLastTouchStartCoordinates = new float[2];
  private boolean mTouchMoveStarted = false;

  public JSTouchDispatcher(ViewGroup viewGroup) {
    mRootViewGroup = viewGroup;
  }

  public void onChildStartedNativeGesture(
      MotionEvent androidEvent, EventDispatcher eventDispatcher) {
    if (mChildIsHandlingNativeGesture) {
      // This means we previously had another child start handling this native gesture and now a
      // different native parent of that child has decided to intercept the touch stream and handle
      // the gesture itself. Example where this can happen: HorizontalScrollView in a ScrollView.
      return;
    }

    dispatchCancelEvent(androidEvent, eventDispatcher);
    mChildIsHandlingNativeGesture = true;
    mTargetTag = -1;
  }

  /**
   * Main catalyst view is responsible for collecting and sending touch events to JS. This method
   * reacts for an incoming android native touch events ({@link MotionEvent}) and calls into {@link
   * com.facebook.react.uimanager.events.EventDispatcher} when appropriate. It uses {@link
   * com.facebook.react.uimanager.TouchTargetHelper#findTouchTargetView} helper method for figuring
   * out a react view ID in the case of ACTION_DOWN event (when the gesture starts).
   */
  public void handleTouchEvent(MotionEvent ev, EventDispatcher eventDispatcher) {
    int action = ev.getAction() & MotionEvent.ACTION_MASK;
    if (action == MotionEvent.ACTION_DOWN) {
      if (mTargetTag != -1) {
        FLog.e(
            ReactConstants.TAG, "Got DOWN touch before receiving UP or CANCEL from last gesture");
      }

      this.markTouchStarted(ev);
      eventDispatcher.dispatchEvent(
          TouchEvent.obtain(
              mTargetTag,
              TouchEventType.START,
              ev,
              mGestureStartTime,
              mTargetCoordinates[0],
              mTargetCoordinates[1],
              mTouchEventCoalescingKeyHelper));
    } else if (mChildIsHandlingNativeGesture) {
      // If the touch was intercepted by a child, we've already sent a cancel event to JS for this
      // gesture, so we shouldn't send any more touches related to it.
      return;
    } else if (mTargetTag == -1) {
      // All the subsequent action types are expected to be called after ACTION_DOWN thus target
      // is supposed to be set for them.
      FLog.e(
          ReactConstants.TAG,
          "Unexpected state: received touch event but didn't get starting ACTION_DOWN for this "
              + "gesture before");
    } else if (action == MotionEvent.ACTION_UP) {
      // End of the gesture. We reset target tag to -1 and expect no further event associated with
      // this gesture.
      findTargetTagAndSetCoordinates(ev);
      eventDispatcher.dispatchEvent(
          TouchEvent.obtain(
              mTargetTag,
              TouchEventType.END,
              ev,
              mGestureStartTime,
              mTargetCoordinates[0],
              mTargetCoordinates[1],
              mTouchEventCoalescingKeyHelper));
      this.markTouchEnded();
    } else if (action == MotionEvent.ACTION_MOVE) {
      // Update pointer position for current gesture
      findTargetTagAndSetCoordinates(ev);
      // Only dispatch the event if we've already started a move or the move is at least some
      // number of pixels away from the starting point
      if (this.shouldDispatchTouchMoveEvent()) {
        eventDispatcher.dispatchEvent(
          TouchEvent.obtain(
            mTargetTag,
            TouchEventType.MOVE,
            ev,
            mGestureStartTime,
            mTargetCoordinates[0],
            mTargetCoordinates[1],
            mTouchEventCoalescingKeyHelper));
      }
    } else if (action == MotionEvent.ACTION_POINTER_DOWN) {
      // New pointer goes down, this can only happen after ACTION_DOWN is sent for the first pointer
      eventDispatcher.dispatchEvent(
          TouchEvent.obtain(
              mTargetTag,
              TouchEventType.START,
              ev,
              mGestureStartTime,
              mTargetCoordinates[0],
              mTargetCoordinates[1],
              mTouchEventCoalescingKeyHelper));
    } else if (action == MotionEvent.ACTION_POINTER_UP) {
      // Exactly onw of the pointers goes up
      eventDispatcher.dispatchEvent(
          TouchEvent.obtain(
              mTargetTag,
              TouchEventType.END,
              ev,
              mGestureStartTime,
              mTargetCoordinates[0],
              mTargetCoordinates[1],
              mTouchEventCoalescingKeyHelper));
    } else if (action == MotionEvent.ACTION_CANCEL) {
      if (mTouchEventCoalescingKeyHelper.hasCoalescingKey(ev.getDownTime())) {
        dispatchCancelEvent(ev, eventDispatcher);
      } else {
        FLog.e(
            ReactConstants.TAG,
            "Received an ACTION_CANCEL touch event for which we have no corresponding ACTION_DOWN");
      }
      this.markTouchEnded();
    } else {
      FLog.w(
          ReactConstants.TAG,
          "Warning : touch event was ignored. Action=" + action + " Target=" + mTargetTag);
    }
  }

  private int findTargetTagAndSetCoordinates(MotionEvent ev) {
    // This method updates `mTargetCoordinates` with coordinates for the motion event.
    return TouchTargetHelper.findTargetTagAndCoordinatesForTouch(
        ev.getX(), ev.getY(), mRootViewGroup, mTargetCoordinates, null);
  }

  private void markTouchStarted(MotionEvent ev) {
    // First event for this gesture. We expect tag to be set to -1, and we use helper method
    // {@link #findTargetTagForTouch} to find react view ID that will be responsible for handling
    // this gesture
    mChildIsHandlingNativeGesture = false;
    mGestureStartTime = ev.getEventTime();
    mTargetTag = findTargetTagAndSetCoordinates(ev);

    // Track the last touch start coordinates to prevent touch moves that are too close to the
    // start coordinates from being emitted. See {@link #shouldDispatchTouchMoveEvent} for
    // more details
    mTouchMoveStarted = false;
    mLastTouchStartCoordinates[0] = mTargetCoordinates[0];
    mLastTouchStartCoordinates[1] = mTargetCoordinates[1];
  }

  private void markTouchEnded() {
    mTargetTag = -1;
    mGestureStartTime = TouchEvent.UNSET;
  }

  /**
   * This function prevents `topTouchMove` events from being dispatched if the user hasn't moved
   * their finger from the start of the last touch, to match the iOS behaviour.
   *
   * On Android, `MotionEvent.ACTION_MOVE` events are dispatched even if the user had moved
   * their finger 0 pixels from the starting point. This is unlike on iOS, where move events
   * are only dispatched after some distance.
   *
   * This causes a problem in the following case:
   *
   * - A parent component has a `PanResponder` that responds to all move events
   * - The parent has a child `Pressable` (or `Touchable`)
   *
   * Because the move event is emitted even without any real move, the parent would take over
   * immediately on press down and no presses would ever register on the child.
   */
  private boolean shouldDispatchTouchMoveEvent() {
    if (mTouchMoveStarted) {
      return true;
    }

    // Logic based on https://github.com/facebook/react-native/blob/v0.63.2/Libraries/Pressability/Pressability.js#L516
    // which recognizes only moves of >10 pixels as moves that should cancel a long press. This
    // matches the behaviour on iOS and prevents move events that aren't really moves from
    // canceling touches on child pressables.
    mTouchMoveStarted = Math.hypot(
      mLastTouchStartCoordinates[0] - mTargetCoordinates[0],
      mLastTouchStartCoordinates[1] - mTargetCoordinates[1]
    ) > 10;

    return mTouchMoveStarted;
  }

  private void dispatchCancelEvent(MotionEvent androidEvent, EventDispatcher eventDispatcher) {
    // This means the gesture has already ended, via some other CANCEL or UP event. This is not
    // expected to happen very often as it would mean some child View has decided to intercept the
    // touch stream and start a native gesture only upon receiving the UP/CANCEL event.
    if (mTargetTag == -1) {
      FLog.w(
          ReactConstants.TAG,
          "Can't cancel already finished gesture. Is a child View trying to start a gesture from "
              + "an UP/CANCEL event?");
      return;
    }

    Assertions.assertCondition(
        !mChildIsHandlingNativeGesture,
        "Expected to not have already sent a cancel for this gesture");
    Assertions.assertNotNull(eventDispatcher)
        .dispatchEvent(
            TouchEvent.obtain(
                mTargetTag,
                TouchEventType.CANCEL,
                androidEvent,
                mGestureStartTime,
                mTargetCoordinates[0],
                mTargetCoordinates[1],
                mTouchEventCoalescingKeyHelper));
  }
}
