/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import android.view.MotionEvent;
import androidx.annotation.Nullable;
import androidx.core.util.Pools;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.WritableMap;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class PointerEvent extends Event<PointerEvent> {
  private static final String TAG = PointerEvent.class.getSimpleName();
  private static final int POINTER_EVENTS_POOL_SIZE = 6;
  private static final Pools.SynchronizedPool<PointerEvent> EVENTS_POOL =
      new Pools.SynchronizedPool<>(POINTER_EVENTS_POOL_SIZE);
  private static final int UNSET_COALESCING_KEY = -1;

  public static PointerEvent obtain(
      String eventName, int surfaceId, int viewTag, MotionEvent motionEventToCopy) {
    PointerEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new PointerEvent();
    }
    event.init(eventName, surfaceId, viewTag, Assertions.assertNotNull(motionEventToCopy), 0);
    return event;
  }

  public static PointerEvent obtain(
      String eventName,
      int surfaceId,
      int viewTag,
      MotionEvent motionEventToCopy,
      int coalescingKey) {
    PointerEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new PointerEvent();
    }
    event.init(
        eventName, surfaceId, viewTag, Assertions.assertNotNull(motionEventToCopy), coalescingKey);
    return event;
  }

  private @Nullable MotionEvent mMotionEvent;
  private @Nullable String mEventName;
  private int mCoalescingKey = UNSET_COALESCING_KEY;

  private void init(
      String eventName,
      int surfaceId,
      int viewTag,
      MotionEvent motionEventToCopy,
      int coalescingKey) {
    super.init(surfaceId, viewTag, motionEventToCopy.getEventTime());
    mEventName = eventName;
    mMotionEvent = MotionEvent.obtain(motionEventToCopy);
    mCoalescingKey = coalescingKey;
  }

  private PointerEvent() {}

  @Override
  public String getEventName() {
    return mEventName;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    // Skip legacy stuff for now?
    return;
  }

  @Override
  public void onDispose() {
    MotionEvent motionEvent = mMotionEvent;
    mMotionEvent = null;
    if (motionEvent != null) {
      motionEvent.recycle();
    }

    // Either `this` is in the event pool, or motionEvent
    // is null. It is in theory not possible for a PointerEvent to
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

  private ArrayList<WritableMap> createPointerEvents() {
    MotionEvent motionEvent = mMotionEvent;
    ArrayList<WritableMap> pointerEvents = new ArrayList<>();

    for (int index = 0; index < motionEvent.getPointerCount(); index++) {
      pointerEvents.add(this.createPointerEvent(index));
    }

    return pointerEvents;
  }

  private WritableMap createPointerEvent(int index) {
    WritableMap pointerEvent = Arguments.createMap();

    pointerEvent.putDouble("pointerId", mMotionEvent.getPointerId(index));
    pointerEvent.putDouble("pressure", mMotionEvent.getPressure(index));
    pointerEvent.putString(
        "pointerType", PointerEventHelper.getW3CPointerType(mMotionEvent.getToolType(index)));

    // Client refers to upper left edge of the content area (viewport)
    // We define the viewport to be ReactRootView
    pointerEvent.putDouble("clientX", mMotionEvent.getX(index));
    pointerEvent.putDouble("clientY", mMotionEvent.getY(index));

    pointerEvent.putInt("target", this.getViewTag());
    pointerEvent.putDouble("timestamp", this.getTimestampMs());
    return pointerEvent;
  }

  @Override
  public void dispatchModern(RCTModernEventEmitter rctEventEmitter) {
    if (mMotionEvent == null) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new IllegalStateException(
              "Cannot dispatch a Pointer that has no MotionEvent; the PointerEvehas been recycled"));
      return;
    }

    List<WritableMap> relevantPointerEventData = null;

    int activePointerIndex = mMotionEvent.getActionIndex();
    switch (mEventName) {
        // Cases where all pointer info is relevant
      case PointerEventHelper.POINTER_MOVE:
      case PointerEventHelper.POINTER_CANCEL:
        relevantPointerEventData = createPointerEvents();
        break;
        // Cases where only the "active" pointer info is relevant
      case PointerEventHelper.POINTER_ENTER:
      case PointerEventHelper.POINTER_DOWN:
      case PointerEventHelper.POINTER_UP:
      case PointerEventHelper.POINTER_LEAVE:
        relevantPointerEventData = Arrays.asList(createPointerEvent(activePointerIndex));
        break;
    }

    if (relevantPointerEventData == null) {
      // No relevant MotionEvent to dispatch
      return;
    }

    boolean shouldCopy = relevantPointerEventData.size() > 1;
    for (WritableMap pointerEventData : relevantPointerEventData) {
      WritableMap eventData = shouldCopy ? pointerEventData.copy() : pointerEventData;
      rctEventEmitter.receiveEvent(
          this.getSurfaceId(),
          this.getViewTag(),
          mEventName,
          mCoalescingKey != UNSET_COALESCING_KEY,
          mCoalescingKey,
          eventData,
          PointerEventHelper.getEventCategory(mEventName));
    }
  }
}
