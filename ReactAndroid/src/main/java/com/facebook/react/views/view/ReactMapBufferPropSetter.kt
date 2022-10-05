/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.graphics.Color
import android.graphics.Rect
import androidx.core.view.ViewCompat
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.PointerEvents

object ReactMapBufferPropSetter {
  // ViewProps values
  private const val VP_ACCESSIBILITY_ACTIONS = 0
  private const val VP_ACCESSIBILITY_HINT = 1
  private const val VP_ACCESSIBILITY_LABEL = 2
  private const val VP_ACCESSIBILITY_LABELLED_BY = 3
  private const val VP_ACCESSIBILITY_LIVE_REGION = 4
  private const val VP_ACCESSIBILITY_ROLE = 5
  private const val VP_ACCESSIBILITY_STATE = 6
  private const val VP_ACCESSIBILITY_VALUE = 7
  private const val VP_ACCESSIBLE = 8
  private const val VP_BACKFACE_VISIBILITY = 9
  private const val VP_BG_COLOR = 10
  private const val VP_BORDER_COLOR = 11
  private const val VP_BORDER_RADII = 12
  private const val VP_BORDER_STYLE = 13
  private const val VP_COLLAPSABLE = 14
  private const val VP_ELEVATION = 15
  private const val VP_FOCUSABLE = 16
  private const val VP_HAS_TV_FOCUS = 17
  private const val VP_HIT_SLOP = 18
  private const val VP_IMPORTANT_FOR_ACCESSIBILITY = 19
  private const val VP_NATIVE_BACKGROUND = 20
  private const val VP_NATIVE_FOREGROUND = 21
  private const val VP_NATIVE_ID = 22
  private const val VP_OFFSCREEN_ALPHA_COMPOSITING = 23
  private const val VP_OPACITY = 24
  private const val VP_POINTER_EVENTS = 25
  private const val VP_POINTER_ENTER = 26
  private const val VP_POINTER_LEAVE = 27
  private const val VP_POINTER_MOVE = 28
  private const val VP_REMOVE_CLIPPED_SUBVIEW = 29
  private const val VP_RENDER_TO_HARDWARE_TEXTURE = 30
  private const val VP_SHADOW_COLOR = 31
  private const val VP_TEST_ID = 32
  private const val VP_TRANSFORM = 33
  private const val VP_ZINDEX = 34
  private const val VP_POINTER_ENTER_CAPTURE = 38
  private const val VP_POINTER_LEAVE_CAPTURE = 39
  private const val VP_POINTER_MOVE_CAPTURE = 40
  private const val VP_POINTER_OUT = 41
  private const val VP_POINTER_OUT_CAPTURE = 42
  private const val VP_POINTER_OVER = 43
  private const val VP_POINTER_OVER_CAPTURE = 44
  private const val VP_BORDER_CURVES = 45 // iOS only
  private const val VP_FG_COLOR = 46 // iOS only?

  // Yoga values
  private const val YG_BORDER_WIDTH = 100
  private const val YG_OVERFLOW = 101

  // AccessibilityAction values
  private const val ACCESSIBILITY_ACTION_NAME = 0
  private const val ACCESSIBILITY_ACTION_LABEL = 1

  // AccessibilityState values
  private const val ACCESSIBILITY_STATE_BUSY = 0
  private const val ACCESSIBILITY_STATE_DISABLED = 1
  private const val ACCESSIBILITY_STATE_EXPANDED = 2
  private const val ACCESSIBILITY_STATE_SELECTED = 3
  private const val ACCESSIBILITY_STATE_CHECKED = 4

  private const val EDGE_TOP = 0
  private const val EDGE_LEFT = 1
  private const val EDGE_RIGHT = 2
  private const val EDGE_BOTTOM = 3
  private const val EDGE_START = 4
  private const val EDGE_END = 5
  private const val EDGE_ALL = 6

  private const val CORNER_TOP_LEFT = 0
  private const val CORNER_TOP_RIGHT = 1
  private const val CORNER_BOTTOM_RIGHT = 2
  private const val CORNER_BOTTOM_LEFT = 3
  private const val CORNER_TOP_START = 4
  private const val CORNER_TOP_END = 5
  private const val CORNER_BOTTOM_END = 6
  private const val CORNER_BOTTOM_START = 7
  private const val CORNER_ALL = 8

  private const val NATIVE_DRAWABLE_KIND = 0
  private const val NATIVE_DRAWABLE_ATTRIBUTE = 1
  private const val NATIVE_DRAWABLE_COLOR = 2
  private const val NATIVE_DRAWABLE_BORDERLESS = 3
  private const val NATIVE_DRAWABLE_RIPPLE_RADIUS = 4

  private const val UNDEF_COLOR = Int.MAX_VALUE

  fun setProps(view: ReactViewGroup, viewManager: ReactViewManager, props: MapBuffer) {
    for (entry in props) {
      when (entry.key) {
        VP_ACCESSIBILITY_ACTIONS -> {
          viewManager.accessibilityActions(view, entry.mapBufferValue)
        }
        VP_ACCESSIBILITY_HINT -> {
          viewManager.setAccessibilityHint(view, entry.stringValue.takeIf { it.isNotEmpty() })
        }
        VP_ACCESSIBILITY_LABEL -> {
          viewManager.setAccessibilityLabel(view, entry.stringValue.takeIf { it.isNotEmpty() })
        }
        VP_ACCESSIBILITY_LABELLED_BY -> {
          viewManager.accessibilityLabelledBy(view, entry.mapBufferValue)
        }
        VP_ACCESSIBILITY_LIVE_REGION -> {
          view.accessibilityLiveRegion(entry.intValue)
        }
        VP_ACCESSIBILITY_ROLE -> {
          viewManager.setAccessibilityRole(view, entry.stringValue.takeIf { it.isNotEmpty() })
        }
        VP_ACCESSIBILITY_STATE -> {
          viewManager.accessibilityState(view, entry.mapBufferValue)
        }
        VP_ACCESSIBILITY_VALUE -> {
          viewManager.accessibilityValue(view, entry.stringValue)
        }
        VP_ACCESSIBLE -> {
          viewManager.setAccessible(view, entry.booleanValue)
        }
        VP_BACKFACE_VISIBILITY -> {
          viewManager.backfaceVisibility(view, entry.intValue)
        }
        VP_BG_COLOR -> {
          // TODO: color for some reason can be object in Java but not in C++
          viewManager.backgroundColor(view, entry.intValue)
        }
        VP_FG_COLOR -> {
          // Prop not used on Android?
        }
        VP_BORDER_COLOR -> {
          viewManager.borderColor(view, entry.mapBufferValue)
        }
        VP_BORDER_RADII -> {
          viewManager.borderRadius(view, entry.mapBufferValue)
        }
        VP_BORDER_STYLE -> {
          val styleBuffer = entry.mapBufferValue
          if (styleBuffer.contains(CORNER_ALL)) {
            viewManager.borderStyle(view, (styleBuffer.getDouble(CORNER_ALL)).toInt())
          }
        }
        VP_ELEVATION -> {
          viewManager.setElevation(view, entry.doubleValue.toFloat())
        }
        VP_FOCUSABLE -> {
          viewManager.setFocusable(view, entry.booleanValue)
        }
        VP_HAS_TV_FOCUS -> {
          viewManager.setTVPreferredFocus(view, entry.booleanValue)
        }
        VP_HIT_SLOP -> {
          view.hitSlop(entry.mapBufferValue)
        }
        VP_IMPORTANT_FOR_ACCESSIBILITY -> {
          view.importantForAccessibility(entry.intValue)
        }
        VP_NATIVE_BACKGROUND -> {
          viewManager.nativeBackground(view, entry.mapBufferValue)
        }
        VP_NATIVE_FOREGROUND -> {
          viewManager.nativeForeground(view, entry.mapBufferValue)
        }
        VP_NATIVE_ID -> {
          viewManager.setNativeId(view, entry.stringValue.takeIf { it.isNotEmpty() })
        }
        VP_OFFSCREEN_ALPHA_COMPOSITING -> {
          viewManager.setNeedsOffscreenAlphaCompositing(view, entry.booleanValue)
        }
        VP_OPACITY -> {
          viewManager.setOpacity(view, entry.doubleValue.toFloat())
        }
        VP_POINTER_EVENTS -> {
          view.pointerEvents(entry.intValue)
        }
        VP_POINTER_ENTER -> {
          viewManager.setPointerEnter(view, entry.booleanValue)
        }
        VP_POINTER_LEAVE -> {
          viewManager.setPointerLeave(view, entry.booleanValue)
        }
        VP_POINTER_MOVE -> {
          viewManager.setPointerMove(view, entry.booleanValue)
        }
        VP_POINTER_ENTER_CAPTURE -> {
          viewManager.setPointerEnterCapture(view, entry.booleanValue)
        }
        VP_POINTER_LEAVE_CAPTURE -> {
          viewManager.setPointerLeaveCapture(view, entry.booleanValue)
        }
        VP_POINTER_MOVE_CAPTURE -> {
          viewManager.setPointerMoveCapture(view, entry.booleanValue)
        }
        VP_POINTER_OUT -> {
          viewManager.setPointerOut(view, entry.booleanValue)
        }
        VP_POINTER_OUT_CAPTURE -> {
          viewManager.setPointerOutCapture(view, entry.booleanValue)
        }
        VP_POINTER_OVER -> {
          viewManager.setPointerOver(view, entry.booleanValue)
        }
        VP_POINTER_OVER_CAPTURE -> {
          viewManager.setPointerOverCapture(view, entry.booleanValue)
        }
        VP_REMOVE_CLIPPED_SUBVIEW -> {
          viewManager.setRemoveClippedSubviews(view, entry.booleanValue)
        }
        VP_RENDER_TO_HARDWARE_TEXTURE -> {
          viewManager.setRenderToHardwareTexture(view, entry.booleanValue)
        }
        VP_SHADOW_COLOR -> {
          // TODO: color for some reason can be object in Java but not in C++
          viewManager.shadowColor(view, entry.intValue)
        }
        VP_TEST_ID -> {
          viewManager.setTestId(view, entry.stringValue.takeIf { it.isNotEmpty() })
        }
        VP_TRANSFORM -> {
          viewManager.transform(view, entry.mapBufferValue)
        }
        VP_ZINDEX -> {
          viewManager.setZIndex(view, entry.intValue.toFloat())
        }
        YG_BORDER_WIDTH -> {
          viewManager.borderWidth(view, entry.mapBufferValue)
        }
        YG_OVERFLOW -> {
          viewManager.overflow(view, entry.intValue)
        }
      }
    }
  }

  private fun ReactViewManager.accessibilityActions(view: ReactViewGroup, mapBuffer: MapBuffer) {
    val actions = mutableListOf<ReadableMap>()
    for (entry in mapBuffer) {
      val map = JavaOnlyMap()
      val action = entry.mapBufferValue
      if (action != null) {
        map.putString("name", action.getString(ACCESSIBILITY_ACTION_NAME))
        if (action.contains(ACCESSIBILITY_ACTION_LABEL)) {
          map.putString("label", action.getString(ACCESSIBILITY_ACTION_LABEL))
        }
      }
      actions.add(map)
    }

    setAccessibilityActions(view, JavaOnlyArray.from(actions))
  }

  private fun ReactViewGroup.accessibilityLiveRegion(value: Int) {
    val mode =
        when (value) {
          0 -> ViewCompat.ACCESSIBILITY_LIVE_REGION_NONE
          1 -> ViewCompat.ACCESSIBILITY_LIVE_REGION_POLITE
          2 -> ViewCompat.ACCESSIBILITY_LIVE_REGION_ASSERTIVE
          else -> ViewCompat.ACCESSIBILITY_LIVE_REGION_NONE
        }
    ViewCompat.setAccessibilityLiveRegion(this, mode)
  }

  private fun ReactViewManager.accessibilityState(view: ReactViewGroup, value: MapBuffer) {
    val accessibilityState = JavaOnlyMap()
    accessibilityState.putBoolean("selected", value.getBoolean(ACCESSIBILITY_STATE_SELECTED))
    accessibilityState.putBoolean("busy", value.getBoolean(ACCESSIBILITY_STATE_BUSY))
    accessibilityState.putBoolean("expanded", value.getBoolean(ACCESSIBILITY_STATE_EXPANDED))
    accessibilityState.putBoolean("disabled", value.getBoolean(ACCESSIBILITY_STATE_DISABLED))

    when (value.getInt(ACCESSIBILITY_STATE_CHECKED)) {
      // Unchecked
      0 -> accessibilityState.putBoolean("checked", false)
      // Checked
      1 -> accessibilityState.putBoolean("checked", true)
      // Mixed
      2 -> accessibilityState.putString("checked", "mixed")
    // 3 -> None
    }

    setViewState(view, accessibilityState)
  }

  private fun ReactViewManager.accessibilityValue(view: ReactViewGroup, value: String) {
    val map = JavaOnlyMap()
    if (value.isNotEmpty()) {
      map.putString("text", value)
    }
    setAccessibilityValue(view, map)
  }

  private fun ReactViewManager.accessibilityLabelledBy(view: ReactViewGroup, value: MapBuffer) {
    val converted =
        if (value.count == 0) {
          DynamicFromObject(null)
        } else {
          val array = JavaOnlyArray()
          for (label in value) {
            array.pushString(label.stringValue)
          }
          DynamicFromObject(array)
        }

    setAccessibilityLabelledBy(view, converted)
  }

  private fun ReactViewManager.backfaceVisibility(view: ReactViewGroup, value: Int) {
    val stringName =
        when (value) {
          1 -> "visible"
          2 -> "hidden"
          else -> "auto"
        }
    setBackfaceVisibility(view, stringName)
  }

  private fun ReactViewManager.backgroundColor(view: ReactViewGroup, value: Int) {
    val color = value.takeIf { it != UNDEF_COLOR } ?: Color.TRANSPARENT
    setBackgroundColor(view, color)
  }

  private fun ReactViewManager.borderColor(view: ReactViewGroup, value: MapBuffer) {
    for (entry in value) {
      val index =
          when (val key = entry.key) {
            EDGE_ALL -> 0
            EDGE_LEFT -> 1
            EDGE_RIGHT -> 2
            EDGE_TOP -> 3
            EDGE_BOTTOM -> 4
            EDGE_START -> 5
            EDGE_END -> 6
            else -> throw IllegalArgumentException("Unknown key for border color: $key")
          }
      val colorValue = entry.intValue
      setBorderColor(view, index, colorValue.takeIf { it != -1 })
    }
  }

  private fun ReactViewManager.borderRadius(view: ReactViewGroup, value: MapBuffer) {
    for (entry in value) {
      val index =
          when (val key = entry.key) {
            CORNER_ALL -> 0
            CORNER_TOP_LEFT -> 1
            CORNER_TOP_RIGHT -> 2
            CORNER_BOTTOM_RIGHT -> 3
            CORNER_BOTTOM_LEFT -> 4
            CORNER_TOP_START -> 5
            CORNER_TOP_END -> 6
            CORNER_BOTTOM_START -> 7
            CORNER_BOTTOM_END -> 8
            else -> throw IllegalArgumentException("Unknown key for border style: $key")
          }
      val borderRadius = entry.doubleValue
      if (!borderRadius.isNaN()) {
        setBorderRadius(view, index, borderRadius.toFloat())
      }
    }
  }

  private fun ReactViewManager.borderStyle(view: ReactViewGroup, value: Int) {
    val stringValue =
        when (value) {
          0 -> "solid"
          1 -> "dotted"
          2 -> "dashed"
          else -> null
        }
    setBorderStyle(view, stringValue)
  }

  private fun ReactViewGroup.hitSlop(value: MapBuffer) {
    val rect =
        Rect(
            PixelUtil.toPixelFromDIP(value.getDouble(EDGE_LEFT)).toInt(),
            PixelUtil.toPixelFromDIP(value.getDouble(EDGE_TOP)).toInt(),
            PixelUtil.toPixelFromDIP(value.getDouble(EDGE_RIGHT)).toInt(),
            PixelUtil.toPixelFromDIP(value.getDouble(EDGE_BOTTOM)).toInt(),
        )
    hitSlopRect = rect
  }

  private fun ReactViewGroup.importantForAccessibility(value: Int) {
    val mode =
        when (value) {
          0 -> ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_AUTO
          1 -> ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_YES
          2 -> ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO
          3 -> ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
          else -> ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_AUTO
        }
    ViewCompat.setImportantForAccessibility(this, mode)
  }

  private fun ReactViewGroup.pointerEvents(value: Int) {
    val pointerEvents =
        when (value) {
          0 -> PointerEvents.AUTO
          1 -> PointerEvents.NONE
          2 -> PointerEvents.BOX_NONE
          3 -> PointerEvents.BOX_ONLY
          else -> throw IllegalArgumentException("Unknown value for pointer events: $value")
        }
    setPointerEvents(pointerEvents)
  }

  private fun ReactViewManager.transform(view: ReactViewGroup, value: MapBuffer) {
    val list = JavaOnlyArray()
    for (entry in value) {
      list.pushDouble(entry.doubleValue)
    }
    setTransform(view, list)
  }

  private fun ReactViewManager.borderWidth(view: ReactViewGroup, value: MapBuffer) {
    for (entry in value) {
      val index =
          when (val key = entry.key) {
            EDGE_ALL -> 0
            EDGE_LEFT -> 1
            EDGE_RIGHT -> 2
            EDGE_TOP -> 3
            EDGE_BOTTOM -> 4
            EDGE_START -> 5
            EDGE_END -> 6
            else -> throw IllegalArgumentException("Unknown key for border width: $key")
          }
      val borderWidth = entry.doubleValue
      if (!borderWidth.isNaN()) {
        setBorderWidth(view, index, borderWidth.toFloat())
      }
    }
  }

  private fun ReactViewManager.overflow(view: ReactViewGroup, value: Int) {
    val stringValue =
        when (value) {
          0 -> "visible"
          1 -> "hidden"
          2 -> "scroll"
          else -> throw IllegalArgumentException("Unknown overflow value: $value")
        }

    setOverflow(view, stringValue)
  }

  private fun ReactViewManager.shadowColor(view: ReactViewGroup, value: Int) {
    val color = value.takeIf { it != UNDEF_COLOR } ?: Color.BLACK
    setShadowColor(view, color)
  }

  private fun ReactViewManager.nativeBackground(view: ReactViewGroup, value: MapBuffer) {
    setNativeBackground(view, value.toJsDrawableDescription())
  }

  private fun ReactViewManager.nativeForeground(view: ReactViewGroup, value: MapBuffer) {
    setNativeForeground(view, value.toJsDrawableDescription())
  }

  private fun MapBuffer.toJsDrawableDescription(): ReadableMap? {
    if (count == 0) {
      return null
    }

    val kind = getInt(NATIVE_DRAWABLE_KIND)
    val result = JavaOnlyMap()
    when (kind) {
      0 -> {
        result.putString("type", "ThemeAttrAndroid")
        result.putString("attribute", getString(NATIVE_DRAWABLE_ATTRIBUTE))
      }
      1 -> {
        result.putString("type", "RippleAndroid")
        if (contains(NATIVE_DRAWABLE_COLOR)) {
          result.putInt("color", getInt(NATIVE_DRAWABLE_COLOR))
        }
        result.putBoolean("borderless", getBoolean(NATIVE_DRAWABLE_BORDERLESS))
        if (contains(NATIVE_DRAWABLE_RIPPLE_RADIUS)) {
          result.putDouble("rippleRadius", getDouble(NATIVE_DRAWABLE_RIPPLE_RADIUS))
        }
      }
      else -> throw IllegalArgumentException("Unknown native drawable: $kind")
    }
    return result
  }
}
