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
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.TouchTargetHelper;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class PointerEvent extends Event<PointerEvent> {
  private static final String TAG = PointerEvent.class.getSimpleName();
  private static final int POINTER_EVENTS_POOL_SIZE = 6;
  private static final Pools.SynchronizedPool<PointerEvent> EVENTS_POOL =
      new Pools.SynchronizedPool<>(POINTER_EVENTS_POOL_SIZE);
  private static final short UNSET_COALESCING_KEY = -1;

  public static PointerEvent obtain(
      String eventName,
      int targetTag,
      PointerEventState eventState,
      MotionEvent motionEventToCopy) {
    PointerEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new PointerEvent();
    }
    event.init(
        eventName, targetTag, eventState, Assertions.assertNotNull(motionEventToCopy), (short) 0);
    return event;
  }

  public static PointerEvent obtain(
      String eventName,
      int targetTag,
      PointerEventState eventState,
      MotionEvent motionEventToCopy,
      short coalescingKey) {
    PointerEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new PointerEvent();
    }
    event.init(
        eventName,
        targetTag,
        eventState,
        Assertions.assertNotNull(motionEventToCopy),
        coalescingKey);
    return event;
  }

  private @Nullable MotionEvent mMotionEvent;
  private @Nullable String mEventName;
  private short mCoalescingKey = UNSET_COALESCING_KEY;
  private @Nullable List<WritableMap> mPointersEventData;
  private PointerEventState mEventState;
  private @Nullable Event.EventAnimationDriverMatchSpec mEventAnimationDriverMatchSpec;

  private void init(
      String eventName,
      int targetTag,
      PointerEventState eventState,
      MotionEvent motionEventToCopy,
      short coalescingKey) {

    super.init(eventState.getSurfaceId(), targetTag, motionEventToCopy.getEventTime());
    mEventName = eventName;
    mMotionEvent = MotionEvent.obtain(motionEventToCopy);
    mCoalescingKey = coalescingKey;
    mEventState = eventState;
  }

  private PointerEvent() {}

  @Override
  public String getEventName() {
    return mEventName;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    if (mMotionEvent == null) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new IllegalStateException(
              "Cannot dispatch a Pointer that has no MotionEvent; the PointerEvehas been recycled"));
      return;
    }
    if (mPointersEventData == null) {
      mPointersEventData = createPointersEventData();
    }

    if (mPointersEventData == null) {
      // No relevant MotionEvent to dispatch
      return;
    }

    boolean shouldCopy = mPointersEventData.size() > 1;
    for (WritableMap pointerEventData : mPointersEventData) {
      WritableMap eventData = shouldCopy ? pointerEventData.copy() : pointerEventData;
      rctEventEmitter.receiveEvent(this.getViewTag(), mEventName, eventData);
    }
    return;
  }

  @Override
  public Event.EventAnimationDriverMatchSpec getEventAnimationDriverMatchSpec() {
    if (mEventAnimationDriverMatchSpec == null) {
      mEventAnimationDriverMatchSpec =
          new EventAnimationDriverMatchSpec() {
            @Override
            public boolean match(int viewTag, String eventName) {
              if (!PointerEventHelper.isBubblingEvent(eventName)) {
                return false;
              }

              List<TouchTargetHelper.ViewTarget> viewTargets =
                  mEventState.getHitPathForActivePointer();
              for (TouchTargetHelper.ViewTarget viewTarget : viewTargets) {
                if (viewTarget.getViewId() == viewTag && eventName.equals(mEventName)) {
                  return true;
                }
              }
              return false;
            }
          };
    }
    return mEventAnimationDriverMatchSpec;
  }

  @Override
  public void onDispose() {
    mPointersEventData = null;
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

  private List<WritableMap> createW3CPointerEvents() {

    ArrayList<WritableMap> w3cPointerEvents = new ArrayList<>();
    for (int index = 0; index < mMotionEvent.getPointerCount(); index++) {
      w3cPointerEvents.add(this.createW3CPointerEvent(index));
    }

    return w3cPointerEvents;
  }

  private WritableMap createW3CPointerEvent(int index) {
    WritableMap pointerEvent = Arguments.createMap();
    int pointerId = mMotionEvent.getPointerId(index);

    // https://www.w3.org/TR/pointerevents/#pointerevent-interface
    pointerEvent.putDouble("pointerId", pointerId);

    String pointerType = PointerEventHelper.getW3CPointerType(mMotionEvent.getToolType(index));
    pointerEvent.putString("pointerType", pointerType);

    pointerEvent.putBoolean(
        "isPrimary",
        PointerEventHelper.isPrimary(pointerId, mEventState.getPrimaryPointerId(), mMotionEvent));

    // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
    // Client refers to upper left edge of the content area (viewport)
    // We define the viewport to be ReactRootView
    float[] eventCoords = mEventState.getEventCoordinatesByPointerId().get(pointerId);
    double clientX = PixelUtil.toDIPFromPixel(eventCoords[0]);
    double clientY = PixelUtil.toDIPFromPixel(eventCoords[1]);
    pointerEvent.putDouble("clientX", clientX);
    pointerEvent.putDouble("clientY", clientY);

    // x,y values are aliases of clientX, clientY
    pointerEvent.putDouble("x", clientX);
    pointerEvent.putDouble("y", clientY);

    // page values in react-native are equivalent to client values since rootview is not scrollable
    pointerEvent.putDouble("pageX", clientX);
    pointerEvent.putDouble("pageY", clientY);

    // Offset refers to upper left edge of the target view
    float[] offsetCoords = mEventState.getOffsetByPointerId().get(pointerId);
    pointerEvent.putDouble("offsetX", PixelUtil.toDIPFromPixel(offsetCoords[0]));
    pointerEvent.putDouble("offsetY", PixelUtil.toDIPFromPixel(offsetCoords[1]));

    pointerEvent.putInt("target", this.getViewTag());
    pointerEvent.putDouble("timestamp", this.getTimestampMs());

    pointerEvent.putInt("detail", 0);
    pointerEvent.putDouble("tiltX", 0);
    pointerEvent.putDouble("tiltY", 0);

    if (pointerType.equals(PointerEventHelper.POINTER_TYPE_MOUSE)) {
      pointerEvent.putDouble("width", 1);
      pointerEvent.putDouble("height", 1);
    } else {
      float majorAxis = PixelUtil.toDIPFromPixel(mMotionEvent.getTouchMajor(index));
      pointerEvent.putDouble("width", majorAxis);
      pointerEvent.putDouble("height", majorAxis);
    }

    int buttonState = mMotionEvent.getButtonState();
    pointerEvent.putInt(
        "button",
        PointerEventHelper.getButtonChange(
            pointerType, mEventState.getLastButtonState(), buttonState));
    pointerEvent.putInt(
        "buttons", PointerEventHelper.getButtons(mEventName, pointerType, buttonState));

    pointerEvent.putDouble(
        "pressure", PointerEventHelper.getPressure(pointerEvent.getInt("buttons"), mEventName));

    return pointerEvent;
  }

  private List<WritableMap> createPointersEventData() {
    int activePointerIndex = mMotionEvent.getActionIndex();
    List<WritableMap> pointersEventData = null;
    switch (mEventName) {
        // Cases where all pointer info is relevant
      case PointerEventHelper.POINTER_MOVE:
      case PointerEventHelper.POINTER_CANCEL:
        pointersEventData = this.createW3CPointerEvents();
        break;
        // Cases where only the "active" pointer info is relevant
      case PointerEventHelper.POINTER_ENTER:
      case PointerEventHelper.POINTER_DOWN:
      case PointerEventHelper.POINTER_UP:
      case PointerEventHelper.POINTER_LEAVE:
      case PointerEventHelper.POINTER_OUT:
      case PointerEventHelper.POINTER_OVER:
        pointersEventData = Arrays.asList(createW3CPointerEvent(activePointerIndex));
        break;
    }

    return pointersEventData;
  }

  @Override
  public short getCoalescingKey() {
    return mCoalescingKey;
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

    if (mPointersEventData == null) {
      mPointersEventData = createPointersEventData();
    }

    if (mPointersEventData == null) {
      // No relevant MotionEvent to dispatch
      return;
    }

    boolean shouldCopy = mPointersEventData.size() > 1;
    for (WritableMap pointerEventData : mPointersEventData) {
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

  public static class PointerEventState {
    private int mPrimaryPointerId;
    private int mActivePointerId;
    private int mLastButtonState;
    private int mSurfaceId;

    private Map<Integer, float[]> mOffsetByPointerId;
    private Map<Integer, List<TouchTargetHelper.ViewTarget>> mHitPathByPointerId;
    private Map<Integer, float[]> mEventCoordinatesByPointerId;

    public PointerEventState(
        int primaryPointerId,
        int activePointerId,
        int lastButtonState,
        int surfaceId,
        Map<Integer, float[]> offsetByPointerId,
        Map<Integer, List<TouchTargetHelper.ViewTarget>> hitPathByPointerId,
        Map<Integer, float[]> eventCoordinatesByPointerId) {
      mPrimaryPointerId = primaryPointerId;
      mActivePointerId = activePointerId;
      mLastButtonState = lastButtonState;
      mSurfaceId = surfaceId;
      mOffsetByPointerId = offsetByPointerId;
      mHitPathByPointerId = hitPathByPointerId;
      mEventCoordinatesByPointerId = eventCoordinatesByPointerId;
    }

    public int getLastButtonState() {
      return mLastButtonState;
    }

    public int getPrimaryPointerId() {
      return mPrimaryPointerId;
    }

    public int getSurfaceId() {
      return mSurfaceId;
    }

    public int getActivePointerId() {
      return mActivePointerId;
    }

    public final Map<Integer, float[]> getOffsetByPointerId() {
      return mOffsetByPointerId;
    }

    public final Map<Integer, List<TouchTargetHelper.ViewTarget>> getHitPathByPointerId() {
      return mHitPathByPointerId;
    }

    public final Map<Integer, float[]> getEventCoordinatesByPointerId() {
      return mEventCoordinatesByPointerId;
    }

    public final List<TouchTargetHelper.ViewTarget> getHitPathForActivePointer() {
      return mHitPathByPointerId.get(mActivePointerId);
    }
  }
}
