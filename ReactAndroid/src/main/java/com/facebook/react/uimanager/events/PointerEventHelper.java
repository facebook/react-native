/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import android.view.MotionEvent;

/** Class responsible for generating catalyst touch events based on android {@link MotionEvent}. */
public class PointerEventHelper {

  public static final String POINTER_TYPE_TOUCH = "touch";
  public static final String POINTER_TYPE_PEN = "pen";
  public static final String POINTER_TYPE_MOUSE = "mouse";
  public static final String POINTER_TYPE_UNKNOWN = "";

  public static final String POINTER_CANCEL = "topPointerCancel";
  public static final String POINTER_DOWN = "topPointerDown";
  public static final String POINTER_ENTER = "topPointerEnter2";
  public static final String POINTER_LEAVE = "topPointerLeave2";
  public static final String POINTER_MOVE = "topPointerMove2";
  public static final String POINTER_UP = "topPointerUp";

  public static String getW3CPointerType(final int toolType) {
    // https://www.w3.org/TR/pointerevents3/#dom-pointerevent-pointertype
    switch (toolType) {
      case MotionEvent.TOOL_TYPE_FINGER:
        return POINTER_TYPE_TOUCH;

      case MotionEvent.TOOL_TYPE_STYLUS:
        return POINTER_TYPE_PEN;

      case MotionEvent.TOOL_TYPE_MOUSE:
        return POINTER_TYPE_MOUSE;
    }
    return POINTER_TYPE_UNKNOWN;
  }

  public static int getEventCategory(String pointerEventType) {
    if (pointerEventType == null) {
      return EventCategoryDef.UNSPECIFIED;
    }
    // Following:
    // https://github.com/facebook/react/blob/main/packages/react-dom/src/events/ReactDOMEventListener.js#L435-L437
    switch (pointerEventType) {
      case POINTER_DOWN:
      case POINTER_CANCEL:
      case POINTER_UP:
        return EventCategoryDef.DISCRETE;
      case POINTER_MOVE:
      case POINTER_ENTER:
      case POINTER_LEAVE:
        return EventCategoryDef.CONTINUOUS;
    }

    return EventCategoryDef.UNSPECIFIED;
  }

  public static boolean supportsHover(final int toolType) {
    String pointerType = getW3CPointerType(toolType);

    if (pointerType.equals(POINTER_TYPE_MOUSE)) {
      return true;
    } else if (pointerType.equals(POINTER_TYPE_PEN)) {
      return true; // true?
    } else if (pointerType.equals(POINTER_TYPE_TOUCH)) {
      return false;
    }

    return false;
  }
}
