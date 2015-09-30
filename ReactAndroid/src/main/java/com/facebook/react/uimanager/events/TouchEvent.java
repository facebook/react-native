/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager.events;

import android.view.MotionEvent;

/**
 * An event representing the start, end or movement of a touch. Corresponds to a single
 * {@link android.view.MotionEvent}.
 *
 * TouchEvent coalescing can happen for move events if two move events have the same target view and
 * coalescing key. See {@link TouchEventCoalescingKeyHelper} for more information about how these
 * coalescing keys are determined.
 */
public class TouchEvent extends Event<TouchEvent> {

  private final MotionEvent mMotionEvent;
  private final TouchEventType mTouchEventType;
  private final short mCoalescingKey;

  public TouchEvent(int viewTag, TouchEventType touchEventType, MotionEvent motionEventToCopy) {
    super(viewTag, motionEventToCopy.getEventTime());
    mTouchEventType = touchEventType;
    mMotionEvent = MotionEvent.obtain(motionEventToCopy);

    short coalescingKey = 0;
    int action = (mMotionEvent.getAction() & MotionEvent.ACTION_MASK);
    switch (action) {
      case MotionEvent.ACTION_DOWN:
        TouchEventCoalescingKeyHelper.addCoalescingKey(mMotionEvent.getDownTime());
        break;
      case MotionEvent.ACTION_UP:
        TouchEventCoalescingKeyHelper.removeCoalescingKey(mMotionEvent.getDownTime());
        break;
      case MotionEvent.ACTION_POINTER_DOWN:
      case MotionEvent.ACTION_POINTER_UP:
        TouchEventCoalescingKeyHelper.incrementCoalescingKey(mMotionEvent.getDownTime());
        break;
      case MotionEvent.ACTION_MOVE:
        coalescingKey = TouchEventCoalescingKeyHelper.getCoalescingKey(mMotionEvent.getDownTime());
        break;
      case MotionEvent.ACTION_CANCEL:
        TouchEventCoalescingKeyHelper.removeCoalescingKey(mMotionEvent.getDownTime());
        break;
      default:
        throw new RuntimeException("Unhandled MotionEvent action: " + action);
    }
    mCoalescingKey = coalescingKey;
  }

  @Override
  public String getEventName() {
    return mTouchEventType.getJSEventName();
  }

  @Override
  public boolean canCoalesce() {
    // We can coalesce move events but not start/end events. Coalescing move events should probably
    // append historical move data like MotionEvent batching does. This is left as an exercise for
    // the reader.
    switch (mTouchEventType) {
      case START:
      case END:
      case CANCEL:
        return false;
      case MOVE:
        return true;
      default:
        throw new RuntimeException("Unknown touch event type: " + mTouchEventType);
    }
  }

  @Override
  public short getCoalescingKey() {
    return mCoalescingKey;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    TouchesHelper.sendTouchEvent(
        rctEventEmitter,
        mTouchEventType,
        getViewTag(),
        mMotionEvent);
  }

  @Override
  public void dispose() {
    mMotionEvent.recycle();
  }
}
