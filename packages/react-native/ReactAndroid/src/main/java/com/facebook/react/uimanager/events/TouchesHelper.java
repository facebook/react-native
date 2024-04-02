/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import android.view.MotionEvent;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.systrace.Systrace;

/** Class responsible for generating catalyst touch events based on android {@link MotionEvent}. */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class TouchesHelper {
  @Deprecated public static final String TARGET_KEY = "target";

  private static final String TARGET_SURFACE_KEY = "targetSurface";
  private static final String CHANGED_TOUCHES_KEY = "changedTouches";
  private static final String TOUCHES_KEY = "touches";
  private static final String PAGE_X_KEY = "pageX";
  private static final String PAGE_Y_KEY = "pageY";
  private static final String TIMESTAMP_KEY = "timestamp";
  private static final String POINTER_IDENTIFIER_KEY = "identifier";

  private static final String LOCATION_X_KEY = "locationX";
  private static final String LOCATION_Y_KEY = "locationY";

  private static final String TAG = "TouchesHelper";

  /**
   * Creates catalyst pointers array in format that is expected by RCTEventEmitter JS module from
   * given {@param event} instance. This method use {@param reactTarget} parameter to set as a
   * target view id associated with current gesture.
   */
  private static WritableMap[] createPointersArray(TouchEvent event) {
    MotionEvent motionEvent = event.getMotionEvent();
    WritableMap[] touches = new WritableMap[motionEvent.getPointerCount()];

    // Calculate the coordinates for the target view.
    // The MotionEvent contains the X,Y of the touch in the coordinate space of the root view
    // The TouchEvent contains the X,Y of the touch in the coordinate space of the target view
    // Subtracting them allows us to get the coordinates of the target view's top left corner
    // We then use this when computing the view specific touches below
    // Since only one view is actually handling even multiple touches, the values are all relative
    // to this one target view.
    float targetViewCoordinateX = motionEvent.getX() - event.getViewX();
    float targetViewCoordinateY = motionEvent.getY() - event.getViewY();

    for (int index = 0; index < motionEvent.getPointerCount(); index++) {
      WritableMap touch = Arguments.createMap();
      // pageX,Y values are relative to the RootReactView
      // the motionEvent already contains coordinates in that view
      touch.putDouble(PAGE_X_KEY, PixelUtil.toDIPFromPixel(motionEvent.getX(index)));
      touch.putDouble(PAGE_Y_KEY, PixelUtil.toDIPFromPixel(motionEvent.getY(index)));
      // locationX,Y values are relative to the target view
      // To compute the values for the view, we subtract that views location from the event X,Y
      float locationX = motionEvent.getX(index) - targetViewCoordinateX;
      float locationY = motionEvent.getY(index) - targetViewCoordinateY;
      touch.putDouble(LOCATION_X_KEY, PixelUtil.toDIPFromPixel(locationX));
      touch.putDouble(LOCATION_Y_KEY, PixelUtil.toDIPFromPixel(locationY));
      touch.putInt(TARGET_SURFACE_KEY, event.getSurfaceId());
      touch.putInt(TARGET_KEY, event.getViewTag());
      touch.putDouble(TIMESTAMP_KEY, event.getTimestampMs());
      touch.putDouble(POINTER_IDENTIFIER_KEY, motionEvent.getPointerId(index));

      touches[index] = touch;
    }

    return touches;
  }

  /**
   * Generate and send touch event to RCTEventEmitter JS module associated with the given {@param
   * context} for legacy renderer. Touch event can encode multiple concurrent touches (pointers).
   *
   * @param rctEventEmitter Event emitter used to execute JS module call
   * @param touchEvent native touch event to read pointers count and coordinates from
   */
  /* package */ static void sendTouchesLegacy(
      RCTEventEmitter rctEventEmitter, TouchEvent touchEvent) {
    TouchEventType type = touchEvent.getTouchEventType();

    WritableArray pointers =
        getWritableArray(/* copyObjects */ false, createPointersArray(touchEvent));
    MotionEvent motionEvent = touchEvent.getMotionEvent();

    // For START and END events send only index of the pointer that is associated with that event
    // For MOVE and CANCEL events 'changedIndices' array should contain all the pointers indices
    WritableArray changedIndices = Arguments.createArray();
    if (type == TouchEventType.MOVE || type == TouchEventType.CANCEL) {
      for (int i = 0; i < motionEvent.getPointerCount(); i++) {
        changedIndices.pushInt(i);
      }
    } else if (type == TouchEventType.START || type == TouchEventType.END) {
      changedIndices.pushInt(motionEvent.getActionIndex());
    } else {
      throw new RuntimeException("Unknown touch type: " + type);
    }

    rctEventEmitter.receiveTouches(TouchEventType.getJSEventName(type), pointers, changedIndices);
  }

  /**
   * Generate touch event data to match JS expectations. Combines logic in {@link #sendTouchEvent}
   * and FabricEventEmitter to create the same data structure in a more efficient manner.
   *
   * <p>Touches have to be dispatched as separate events for each changed pointer to make JS process
   * them correctly. To avoid allocations, we preprocess touch events in Java world and then convert
   * them to native before dispatch.
   *
   * @param eventEmitter emitter to dispatch event to
   * @param event the touch event to extract data from
   */
  /* package */ static void sendTouchEvent(RCTModernEventEmitter eventEmitter, TouchEvent event) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "TouchesHelper.sentTouchEventModern(" + event.getEventName() + ")");
    try {
      TouchEventType type = event.getTouchEventType();
      MotionEvent motionEvent = event.getMotionEvent();

      if (motionEvent == null) {
        ReactSoftExceptionLogger.logSoftException(
            TAG,
            new IllegalStateException(
                "Cannot dispatch a TouchEvent that has no MotionEvent; the TouchEvent has been"
                    + " recycled"));
        return;
      }

      WritableMap[] touches = createPointersArray(event);
      WritableMap[] changedTouches = null;

      switch (type) {
        case START:
          int newPointerIndex = motionEvent.getActionIndex();

          changedTouches = new WritableMap[] {touches[newPointerIndex].copy()};
          break;
        case END:
          int finishedPointerIndex = motionEvent.getActionIndex();
          /*
           * Clear finished pointer index for compatibility with W3C touch "end" events, where the
           * active touches don't include the set that has just been "ended".
           */
          WritableMap finishedPointer = touches[finishedPointerIndex];
          touches[finishedPointerIndex] = null;

          changedTouches = new WritableMap[] {finishedPointer};
          break;
        case MOVE:
          changedTouches = new WritableMap[touches.length];
          for (int i = 0; i < touches.length; i++) {
            changedTouches[i] = touches[i].copy();
          }
          break;
        case CANCEL:
          changedTouches = touches;
          touches = new WritableMap[0];
          break;
      }

      if (changedTouches != null) {
        for (WritableMap touchData : changedTouches) {
          WritableMap eventData = touchData.copy();
          WritableArray changedTouchesArray =
              getWritableArray(/* copyObjects */ true, changedTouches);
          WritableArray touchesArray = getWritableArray(/* copyObjects */ true, touches);

          eventData.putArray(CHANGED_TOUCHES_KEY, changedTouchesArray);
          eventData.putArray(TOUCHES_KEY, touchesArray);

          eventEmitter.receiveEvent(
              event.getSurfaceId(),
              event.getViewTag(),
              event.getEventName(),
              event.canCoalesce(),
              0,
              eventData,
              event.getEventCategory());
        }
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  private static WritableArray getWritableArray(boolean copyObjects, WritableMap... objects) {
    WritableArray result = Arguments.createArray();
    for (WritableMap object : objects) {
      if (object != null) {
        result.pushMap(copyObjects ? object.copy() : object);
      }
    }
    return result;
  }
}
