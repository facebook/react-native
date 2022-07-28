/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import android.view.MotionEvent;
import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.R;
import com.facebook.react.common.ReactConstants;

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
  };

  public static final String POINTER_CANCEL = "topPointerCancel";
  public static final String POINTER_DOWN = "topPointerDown";
  public static final String POINTER_ENTER = "topPointerEnter";
  public static final String POINTER_LEAVE = "topPointerLeave";
  public static final String POINTER_MOVE = "topPointerMove";
  public static final String POINTER_UP = "topPointerUp";

  /** We don't dispatch capture events from native; that's currently handled by JS. */
  public static @Nullable String getDispatchableEventName(EVENT event) {
    switch (event) {
      case LEAVE:
        return PointerEventHelper.POINTER_LEAVE;
      case DOWN:
        return PointerEventHelper.POINTER_DOWN;
      case MOVE:
        return PointerEventHelper.POINTER_MOVE;
      case ENTER:
        return PointerEventHelper.POINTER_ENTER;
      case CANCEL:
        return PointerEventHelper.POINTER_CANCEL;
      case UP:
        return PointerEventHelper.POINTER_UP;
      default:
        FLog.e(ReactConstants.TAG, "No dispatchable event name for type: " + event);
        return null;
    }
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
      return false;
    }

    Object value = null;
    switch (event) {
      case DOWN:
      case DOWN_CAPTURE:
      case UP:
      case UP_CAPTURE:
      case CANCEL:
      case CANCEL_CAPTURE:
        return true;
      case ENTER:
        value = view.getTag(R.id.pointer_enter);
        break;
      case ENTER_CAPTURE:
        value = view.getTag(R.id.pointer_enter_capture);
        break;
      case LEAVE:
        value = view.getTag(R.id.pointer_leave);
        break;
      case LEAVE_CAPTURE:
        value = view.getTag(R.id.pointer_leave_capture);
        break;
      case MOVE:
        value = view.getTag(R.id.pointer_move);
        break;
      case MOVE_CAPTURE:
        value = view.getTag(R.id.pointer_move_capture);
        break;
    }

    if (value == null) {
      return false;
    }

    if (value instanceof Boolean) {
      return (Boolean) value;
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

    int toolType = motionEvent.getToolType(motionEvent.getActionIndex());
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
