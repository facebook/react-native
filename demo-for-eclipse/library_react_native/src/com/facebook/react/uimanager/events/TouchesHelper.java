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

  // TODO(7351435): remove when we standardize touchEvent payload, since iOS uses locationXYZ but
  // Android uses pageXYZ. As a temporary solution, Android currently sends both.
  private static final String LOCATION_X_KEY = "locationX";
  private static final String LOCATION_Y_KEY = "locationY";

  /**
   * Creates catalyst pointers array in format that is expected by RCTEventEmitter JS module from
   * given {@param event} instance. This method use {@param reactTarget} parameter to set as a
   * target view id associated with current gesture.
   */
  private static WritableArray createsPointersArray(int reactTarget, MotionEvent event) {
    WritableArray touches = Arguments.createArray();

    // Calculate raw-to-relative offset as getRawX() and getRawY() can only return values for the
    // pointer at index 0. We use those value to calculate "raw" coordinates for other pointers
    float offsetX = event.getRawX() - event.getX();
    float offsetY = event.getRawY() - event.getY();

    for (int index = 0; index < event.getPointerCount(); index++) {
      WritableMap touch = Arguments.createMap();
      touch.putDouble(PAGE_X_KEY, PixelUtil.toDIPFromPixel(event.getX(index) + offsetX));
      touch.putDouble(PAGE_Y_KEY, PixelUtil.toDIPFromPixel(event.getY(index) + offsetY));
      touch.putDouble(LOCATION_X_KEY, PixelUtil.toDIPFromPixel(event.getX(index)));
      touch.putDouble(LOCATION_Y_KEY, PixelUtil.toDIPFromPixel(event.getY(index)));
      touch.putInt(TARGET_KEY, reactTarget);
      touch.putDouble(TIMESTAMP_KEY, event.getEventTime());
      touch.putDouble(POINTER_IDENTIFIER_KEY, event.getPointerId(index));
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
   * @param androidMotionEvent native touch event to read pointers count and coordinates from
   */
  public static void sendTouchEvent(
      RCTEventEmitter rctEventEmitter,
      TouchEventType type,
      int reactTarget,
      MotionEvent androidMotionEvent) {

    WritableArray pointers = createsPointersArray(reactTarget, androidMotionEvent);

    // For START and END events send only index of the pointer that is associated with that event
    // For MOVE and CANCEL events 'changedIndices' array should contain all the pointers indices
    WritableArray changedIndices = Arguments.createArray();
    if (type == TouchEventType.MOVE || type == TouchEventType.CANCEL) {
      for (int i = 0; i < androidMotionEvent.getPointerCount(); i++) {
        changedIndices.pushInt(i);
      }
    } else if (type == TouchEventType.START || type == TouchEventType.END) {
      changedIndices.pushInt(androidMotionEvent.getActionIndex());
    } else {
      throw new RuntimeException("Unknown touch type: " + type);
    }

    rctEventEmitter.receiveTouches(
        type.getJSEventName(),
        pointers,
        changedIndices);
  }

}
