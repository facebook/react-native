/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import android.view.InputDevice
import android.view.MotionEvent
import android.view.View
import com.facebook.react.R

/** Class responsible for generating catalyst touch events based on android [MotionEvent]. */
internal object PointerEventHelper {
  const val POINTER_TYPE_TOUCH: String = "touch"
  const val POINTER_TYPE_PEN: String = "pen"
  const val POINTER_TYPE_MOUSE: String = "mouse"
  const val POINTER_TYPE_UNKNOWN: String = ""
  const val X_FLAG_SUPPORTS_HOVER = 0x01000000

  const val POINTER_CANCEL: String = "topPointerCancel"
  const val POINTER_DOWN: String = "topPointerDown"
  const val POINTER_ENTER: String = "topPointerEnter"
  const val POINTER_LEAVE: String = "topPointerLeave"
  const val POINTER_MOVE: String = "topPointerMove"
  const val POINTER_UP: String = "topPointerUp"
  const val POINTER_OVER: String = "topPointerOver"
  const val POINTER_OUT: String = "topPointerOut"
  const val CLICK: String = "topClick"

  enum class EVENT {
    CANCEL,
    CANCEL_CAPTURE,
    CLICK,
    CLICK_CAPTURE,
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
  }

  // https://w3c.github.io/pointerevents/#the-buttons-property
  @JvmStatic
  fun getButtons(eventName: String?, pointerType: String, buttonState: Int): Int {
    if (isExitEvent(eventName)) {
      return 0
    }
    if (POINTER_TYPE_TOUCH == pointerType) {
      return 1
    }
    return buttonState
  }

  // https://w3c.github.io/pointerevents/#the-button-property
  @JvmStatic
  fun getButtonChange(pointerType: String, lastButtonState: Int, currentButtonState: Int): Int {
    // Always return 0 for touch
    if (POINTER_TYPE_TOUCH == pointerType) {
      return 0
    }

    val changedMask = currentButtonState xor lastButtonState
    if (changedMask == 0) {
      return -1
    }

    return when (changedMask) {
      MotionEvent.BUTTON_PRIMARY -> 0
      MotionEvent.BUTTON_TERTIARY -> 1
      MotionEvent.BUTTON_SECONDARY -> 2
      MotionEvent.BUTTON_BACK -> 3
      MotionEvent.BUTTON_FORWARD -> 4
      else -> -1
    }
  }

  @JvmStatic
  fun getW3CPointerType(toolType: Int): String {
    // https://www.w3.org/TR/pointerevents3/#dom-pointerevent-pointertype
    return when (toolType) {
      MotionEvent.TOOL_TYPE_FINGER -> POINTER_TYPE_TOUCH
      MotionEvent.TOOL_TYPE_STYLUS -> POINTER_TYPE_PEN
      MotionEvent.TOOL_TYPE_MOUSE -> POINTER_TYPE_MOUSE
      else -> POINTER_TYPE_UNKNOWN
    }
  }

  @JvmStatic
  fun isListening(view: View?, event: EVENT): Boolean {
    if (view == null) {
      return true
    }

    return when (event) {
      EVENT.DOWN,
      EVENT.DOWN_CAPTURE,
      EVENT.UP,
      EVENT.UP_CAPTURE,
      EVENT.CANCEL,
      EVENT.CANCEL_CAPTURE,
      EVENT.CLICK,
      EVENT.CLICK_CAPTURE -> true
      else -> {
        val pointerEvents = view.getTag(R.id.pointer_events) as? Int
        (pointerEvents != null) && (pointerEvents and (1 shl event.ordinal)) != 0
      }
    }
  }

  @JvmStatic
  fun getEventCategory(pointerEventType: String?): Int {
    if (pointerEventType == null) {
      return EventCategoryDef.UNSPECIFIED
    }
    return when (pointerEventType) {
      POINTER_DOWN,
      POINTER_CANCEL,
      POINTER_UP -> EventCategoryDef.DISCRETE
      POINTER_MOVE,
      POINTER_ENTER,
      POINTER_LEAVE,
      POINTER_OVER,
      POINTER_OUT -> EventCategoryDef.CONTINUOUS
      else -> EventCategoryDef.UNSPECIFIED
    }
  }

  fun supportsHover(motionEvent: MotionEvent): Boolean {
    // A flag has been set on the MotionEvent to indicate it supports hover
    // See D36958947 on justifications for this.
    // TODO(luwe): Leverage previous events to determine if MotionEvent
    //  is from an input device that supports hover
    val supportsHoverFlag = (motionEvent.flags and X_FLAG_SUPPORTS_HOVER) != 0
    if (supportsHoverFlag) {
      return true
    }

    return motionEvent.isFromSource(InputDevice.SOURCE_MOUSE)
  }

  fun isExitEvent(eventName: String?): Boolean {
    return when (eventName) {
      POINTER_UP,
      POINTER_LEAVE,
      POINTER_OUT -> true
      else -> false
    }
  }

  // https://w3c.github.io/pointerevents/#dom-pointerevent-pressure
  @JvmStatic
  fun getPressure(buttonState: Int, eventName: String?): Double {
    if (isExitEvent(eventName)) {
      return 0.0
    }

    // Assume  we don't support pressure on our platform for now
    //  For hardware and platforms that do not support pressure,
    //  the value MUST be 0.5 when in the active buttons state
    //  and 0 otherwise.
    val inActiveButtonState = buttonState != 0
    return if (inActiveButtonState) 0.5 else 0.0
  }

  @JvmStatic
  fun isBubblingEvent(eventName: String?): Boolean {
    return when (eventName) {
      POINTER_UP,
      POINTER_DOWN,
      POINTER_OVER,
      POINTER_OUT,
      POINTER_MOVE,
      POINTER_CANCEL -> true
      else -> false
    }
  }
}
