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

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;

/**
 * Class responsible for generating catalyst touch events based on android {@link MotionEvent}.
 */
/*package*/ class TouchesHelper {

  private static final String PAGE_X_KEY = "pageX";
  private static final String PAGE_Y_KEY = "pageY";
  private static final String TARGET_KEY = "target";
  private static final String TIMESTAMP_KEY = "timeStamp";
  private static final String POINTER_IDENTIFIER_KEY = "identifier";

  private static final String LOCATION_X_KEY = "locationX";
  private static final String LOCATION_Y_KEY = "locationY";

  /**
   * Creates catalyst pointers array in format that is expected by RCTEventEmitter JS module from
   * given {@param event} instance. This method use {@param reactTarget} parameter to set as a
   * target view id associated with current gesture.
   */
  private static WritableArray createsPointersArray(int reactTarget, TouchEvent event) {
    WritableArray touches = Arguments.createArray();
    MotionEvent motionEvent = event.getMotionEvent();

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
      touch.putInt(TARGET_KEY, reactTarget);
      touch.putDouble(TIMESTAMP_KEY, event.getTimestampMs());
      touch.putDouble(POINTER_IDENTIFIER_KEY, motionEvent.getPointerId(index));
      touches.pushMap(touch);
    }

    return touches;
  }

  /**
   * Generate and send touch event to RCTEventEmitter JS module associated with the given
   * {@param context}. Touch event can encode multiple concurrent touches (pointers).
   *
   * @param rctEventEmitter Event emitter used to execute JS module call
   * @param type type of the touch event (see {@link TouchEventType})
   * @param reactTarget target view react id associated with this gesture
   * @param touchEvent native touch event to read pointers count and coordinates from
   */
  public static void sendTouchEvent(
      RCTEventEmitter rctEventEmitter,
      TouchEventType type,
      int reactTarget,
      TouchEvent touchEvent) {

    WritableArray pointers = createsPointersArray(reactTarget, touchEvent);
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

    rctEventEmitter.receiveTouches(
        type.getJSEventName(),
        pointers,
        changedIndices);
  }

}
