/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import android.view.MotionEvent;
import androidx.annotation.Nullable;
import androidx.core.util.Pools;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.config.ReactFeatureFlags;

/**
 * An event representing the start, end or movement of a touch. Corresponds to a single {@link
 * android.view.MotionEvent}.
 *
 * <p>TouchEvent coalescing can happen for move events if two move events have the same target view
 * and coalescing key. See {@link TouchEventCoalescingKeyHelper} for more information about how
 * these coalescing keys are determined.
 */
public class TouchEvent extends Event<TouchEvent> {
  private static final String TAG = TouchEvent.class.getSimpleName();

  private static final int TOUCH_EVENTS_POOL_SIZE = 3;

  private static final Pools.SynchronizedPool<TouchEvent> EVENTS_POOL =
      new Pools.SynchronizedPool<>(TOUCH_EVENTS_POOL_SIZE);

  public static final long UNSET = Long.MIN_VALUE;

  @Deprecated
  public static TouchEvent obtain(
      int viewTag,
      TouchEventType touchEventType,
      MotionEvent motionEventToCopy,
      long gestureStartTime,
      float viewX,
      float viewY,
      TouchEventCoalescingKeyHelper touchEventCoalescingKeyHelper) {
    return obtain(
        -1,
        viewTag,
        touchEventType,
        Assertions.assertNotNull(motionEventToCopy),
        gestureStartTime,
        viewX,
        viewY,
        touchEventCoalescingKeyHelper);
  }

  public static TouchEvent obtain(
      int surfaceId,
      int viewTag,
      TouchEventType touchEventType,
      MotionEvent motionEventToCopy,
      long gestureStartTime,
      float viewX,
      float viewY,
      TouchEventCoalescingKeyHelper touchEventCoalescingKeyHelper) {
    TouchEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new TouchEvent();
    }
    event.init(
        surfaceId,
        viewTag,
        touchEventType,
        Assertions.assertNotNull(motionEventToCopy),
        gestureStartTime,
        viewX,
        viewY,
        touchEventCoalescingKeyHelper);
    return event;
  }

  private @Nullable MotionEvent mMotionEvent;
  private @Nullable TouchEventType mTouchEventType;
  private short mCoalescingKey;

  // Coordinates in the ViewTag coordinate space
  private float mViewX;
  private float mViewY;

  private TouchEvent() {}

  private void init(
      int surfaceId,
      int viewTag,
      TouchEventType touchEventType,
      MotionEvent motionEventToCopy,
      long gestureStartTime,
      float viewX,
      float viewY,
      TouchEventCoalescingKeyHelper touchEventCoalescingKeyHelper) {
    super.init(surfaceId, viewTag, motionEventToCopy.getEventTime());

    SoftAssertions.assertCondition(
        gestureStartTime != UNSET, "Gesture start time must be initialized");
    short coalescingKey = 0;
    int action = (motionEventToCopy.getAction() & MotionEvent.ACTION_MASK);
    switch (action) {
      case MotionEvent.ACTION_DOWN:
        touchEventCoalescingKeyHelper.addCoalescingKey(gestureStartTime);
        break;
      case MotionEvent.ACTION_UP:
        touchEventCoalescingKeyHelper.removeCoalescingKey(gestureStartTime);
        break;
      case MotionEvent.ACTION_POINTER_DOWN:
      case MotionEvent.ACTION_POINTER_UP:
        touchEventCoalescingKeyHelper.incrementCoalescingKey(gestureStartTime);
        break;
      case MotionEvent.ACTION_MOVE:
        coalescingKey = touchEventCoalescingKeyHelper.getCoalescingKey(gestureStartTime);
        break;
      case MotionEvent.ACTION_CANCEL:
        touchEventCoalescingKeyHelper.removeCoalescingKey(gestureStartTime);
        break;
      default:
        throw new RuntimeException("Unhandled MotionEvent action: " + action);
    }
    mTouchEventType = touchEventType;
    mMotionEvent = MotionEvent.obtain(motionEventToCopy);
    mCoalescingKey = coalescingKey;
    mViewX = viewX;
    mViewY = viewY;
  }

  @Override
  public void onDispose() {
    MotionEvent motionEvent = mMotionEvent;
    mMotionEvent = null;
    if (motionEvent != null) {
      motionEvent.recycle();
    }

    // Either `this` is in the event pool, or motionEvent
    // is null. It is in theory not possible for a TouchEvent to
    // be in the EVENTS_POOL but for motionEvent to be null. However,
    // out of an abundance of caution and to avoid memory leaks or
    // other crashes at all costs, we attempt to release here and log
    // a soft exception here if release throws an IllegalStateException
    // due to `this` being over-released. This may indicate that there is
    // a logic error in our events system or pooling mechanism.
    try {
      EVENTS_POOL.release(this);
    } catch (IllegalStateException e) {
      ReactSoftExceptionLogger.logSoftException(TAG, e);
    }
  }

  @Override
  public String getEventName() {
    return TouchEventType.getJSEventName(Assertions.assertNotNull(mTouchEventType));
  }

  @Override
  public boolean canCoalesce() {
    // We can coalesce move events but not start/end events. Coalescing move events should probably
    // append historical move data like MotionEvent batching does. This is left as an exercise for
    // the reader.
    switch (Assertions.assertNotNull(mTouchEventType)) {
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
    if (!hasMotionEvent()) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new IllegalStateException(
              "Cannot dispatch a TouchEvent that has no MotionEvent; the TouchEvent has been recycled"));
      return;
    }

    TouchesHelper.sendTouchEvent(rctEventEmitter, this);
  }

  @Override
  public void dispatchModern(RCTModernEventEmitter rctEventEmitter) {
    if (ReactFeatureFlags.useUpdatedTouchPreprocessing) {
      TouchesHelper.sendTouchEventModern(rctEventEmitter, this, /* useDispatchV2 */ false);
    } else {
      dispatch(rctEventEmitter);
    }
  }

  @Override
  public void dispatchModernV2(RCTModernEventEmitter rctEventEmitter) {
    if (ReactFeatureFlags.useUpdatedTouchPreprocessing) {
      TouchesHelper.sendTouchEventModern(rctEventEmitter, this, /* useDispatchV2 */ true);
    } else {
      dispatch(rctEventEmitter);
    }
  }

  @Override
  protected int getEventCategory() {
    TouchEventType type = mTouchEventType;
    if (type == null) {
      return EventCategoryDef.UNSPECIFIED;
    }

    switch (type) {
      case START:
        return EventCategoryDef.CONTINUOUS_START;
      case END:
      case CANCEL:
        return EventCategoryDef.CONTINUOUS_END;
      case MOVE:
        return EventCategoryDef.CONTINUOUS;
    }

    // Something something smart compiler...
    return super.getEventCategory();
  }

  public MotionEvent getMotionEvent() {
    Assertions.assertNotNull(mMotionEvent);
    return mMotionEvent;
  }

  private boolean hasMotionEvent() {
    return mMotionEvent != null;
  }

  public TouchEventType getTouchEventType() {
    return Assertions.assertNotNull(mTouchEventType);
  }

  public float getViewX() {
    return mViewX;
  }

  public float getViewY() {
    return mViewY;
  }
}
