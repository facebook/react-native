/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager.events;

import android.support.v4.util.Pools;
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

  private static final Pools.SynchronizedPool<TouchEvent> EVENTS_POOL =
      new Pools.SynchronizedPool<>(3);

  public static TouchEvent obtain(
      int viewTag,
      long timestampMs,
      TouchEventType touchEventType,
      MotionEvent motionEventToCopy) {
    TouchEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new TouchEvent();
    }
    event.init(viewTag, timestampMs, touchEventType, motionEventToCopy);
    return event;
  }

  private MotionEvent mMotionEvent;
  private TouchEventType mTouchEventType;
  private short mCoalescingKey;

  private TouchEvent() {
  }

  @Override
  public void onDispose() {
    mMotionEvent.recycle();
    mMotionEvent = null;
    EVENTS_POOL.release(this);
  }

  private void init(
      int viewTag,
      long timestampMs,
      TouchEventType touchEventType,
      MotionEvent motionEventToCopy) {
    super.init(viewTag, timestampMs);
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
}
