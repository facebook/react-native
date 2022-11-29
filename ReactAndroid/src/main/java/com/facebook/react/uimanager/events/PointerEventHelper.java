/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.react.R;

/** Class responsible for generating catalyst touch events based on android {@link MotionEvent}. */
public class PointerEventHelper {

  public static final String POINTER_TYPE_TOUCH = "touch";
  public static final String POINTER_TYPE_PEN = "pen";
  public static final String POINTER_TYPE_MOUSE = "mouse";
  public static final String POINTER_TYPE_UNKNOWN = "";
  private static final int X_FLAG_SUPPORTS_HOVER = 0x01000000;

  public static enum EVENT {
    CANCEL,
    CANCEL_CAPTURE,
    DOWN,
    DOWN_CAPTURE,
    ENTER,
    ENTER_CAPTURE,
    LEAVE,
    LEAVE_CAPTURE,
    MOVE,
    MOVE_CAPTURE,
    UP,
    UP_CAPTURE,
    OUT,
    OUT_CAPTURE,
    OVER,
    OVER_CAPTURE,
  };

  public static final String POINTER_CANCEL = "topPointerCancel";
  public static final String POINTER_DOWN = "topPointerDown";
  public static final String POINTER_ENTER = "topPointerEnter";
  public static final String POINTER_LEAVE = "topPointerLeave";
  public static final String POINTER_MOVE = "topPointerMove";
  public static final String POINTER_UP = "topPointerUp";
  public static final String POINTER_OVER = "topPointerOver";
  public static final String POINTER_OUT = "topPointerOut";

  // https://w3c.github.io/pointerevents/#the-buttons-property
  public static int getButtons(String eventName, String pointerType, int buttonState) {
    if (isExitEvent(eventName)) {
      return 0;
    }
    if (POINTER_TYPE_TOUCH.equals(pointerType)) {
      return 1;
    }
    return buttonState;
  }

  // https://w3c.github.io/pointerevents/#the-button-property
  public static int getButtonChange(
      String pointerType, int lastButtonState, int currentButtonState) {
    // Always return 0 for touch
    if (POINTER_TYPE_TOUCH.equals(pointerType)) {
      return 0;
    }

    int changedMask = currentButtonState ^ lastButtonState;
    if (changedMask == 0) {
      return -1;
    }

    switch (changedMask) {
      case MotionEvent.BUTTON_PRIMARY: // left button, touch/pen contact
        return 0;
      case MotionEvent.BUTTON_TERTIARY: // middle mouse
        return 1;
      case MotionEvent.BUTTON_SECONDARY: // rightbutton, Pen barrel button
        return 2;
      case MotionEvent.BUTTON_BACK:
        return 3;
      case MotionEvent.BUTTON_FORWARD:
        return 4;
        // TOD0 - Pen eraser button maps to what?
    }
    return -1;
  }

  public static boolean isPrimary(int pointerId, int primaryPointerId, MotionEvent event) {
    if (supportsHover(event)) {
      return true;
    }

    return pointerId == primaryPointerId;
  }

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

  public static boolean isListening(@Nullable View view, EVENT event) {
    if (view == null) {
      return true;
    }

    switch (event) {
      case DOWN:
      case DOWN_CAPTURE:
      case UP:
      case UP_CAPTURE:
      case CANCEL:
      case CANCEL_CAPTURE:
        return true;
    }

    Integer pointerEvents = (Integer) view.getTag(R.id.pointer_events);
    if (pointerEvents != null) {
      return (pointerEvents.intValue() & (1 << event.ordinal())) != 0;
    }
    return false;
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
      case POINTER_OVER:
      case POINTER_OUT:
        return EventCategoryDef.CONTINUOUS;
    }

    return EventCategoryDef.UNSPECIFIED;
  }

  public static boolean supportsHover(MotionEvent motionEvent) {
    // A flag has been set on the MotionEvent to indicate it supports hover
    // See D36958947 on justifications for this.
    // TODO(luwe): Leverage previous events to determine if MotionEvent
    //  is from an input device that supports hover
    boolean supportsHoverFlag = (motionEvent.getFlags() & X_FLAG_SUPPORTS_HOVER) != 0;
    if (supportsHoverFlag) {
      return true;
    }

    int source = motionEvent.getSource();
    return source == InputDevice.SOURCE_MOUSE;
  }

  public static boolean isExitEvent(String eventName) {
    switch (eventName) {
      case POINTER_UP:
      case POINTER_LEAVE:
      case POINTER_OUT:
        return true;
      default:
        return false;
    }
  }

  // https://w3c.github.io/pointerevents/#dom-pointerevent-pressure
  public static double getPressure(int buttonState, String eventName) {
    if (isExitEvent(eventName)) {
      return 0;
    }

    // Assume  we don't support pressure on our platform for now
    //  For hardware and platforms that do not support pressure,
    //  the value MUST be 0.5 when in the active buttons state
    //  and 0 otherwise.
    boolean inActiveButtonState = buttonState != 0;
    return inActiveButtonState ? 0.5 : 0;
  }

  public static boolean isBubblingEvent(String eventName) {
    switch (eventName) {
      case POINTER_UP:
      case POINTER_DOWN:
      case POINTER_OVER:
      case POINTER_OUT:
      case POINTER_MOVE:
      case POINTER_CANCEL:
        return true;
      default:
        return false;
    }
  }
}
