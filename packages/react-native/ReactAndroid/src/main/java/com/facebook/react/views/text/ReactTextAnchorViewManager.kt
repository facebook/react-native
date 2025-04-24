/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.text.Layout
import android.text.TextUtils
import android.text.util.Linkify
import android.view.Gravity
import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.ViewDefaults
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle.Companion.fromString
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.views.text.DefaultStyleValuesUtil.getDefaultTextColorHighlight

/**
 * Previously a superclass of multiple text view managers. Now only used by [ReactTextViewManager].
 *
 * This is a "shadowing" view manager, which means that the [NativeViewHierarchyManager] will NOT
 * manage children of native [TextView] instances instantiated by this manager. Instead we
 * use @{link ReactBaseTextShadowNode} hierarchy to calculate a [Spannable] text represented the
 * whole text subtree.
 */
internal abstract class ReactTextAnchorViewManager<C : ReactBaseTextShadowNode?> :
    BaseViewManager<ReactTextView, C>() {

  @ReactProp(name = "accessible")
  public fun setAccessible(view: ReactTextView, accessible: Boolean) {
    view.isFocusable = accessible
  }

  // maxLines can only be set in master view (block), doesn't really make sense to set in a span
  @ReactProp(name = ViewProps.NUMBER_OF_LINES, defaultInt = ViewDefaults.NUMBER_OF_LINES)
  public fun setNumberOfLines(view: ReactTextView, numberOfLines: Int) {
    view.setNumberOfLines(numberOfLines)
  }

  @ReactProp(name = ViewProps.ELLIPSIZE_MODE)
  public fun setEllipsizeMode(view: ReactTextView, ellipsizeMode: String?) {
    when (ellipsizeMode) {
      null,
      "tail" -> view.setEllipsizeLocation(TextUtils.TruncateAt.END)
      "head" -> view.setEllipsizeLocation(TextUtils.TruncateAt.START)
      "middle" -> view.setEllipsizeLocation(TextUtils.TruncateAt.MIDDLE)
      "clip" -> view.setEllipsizeLocation(null)
      else -> {
        FLog.w(ReactConstants.TAG, "Invalid ellipsizeMode: $ellipsizeMode")
        view.setEllipsizeLocation(TextUtils.TruncateAt.END)
      }
    }
  }

  @ReactProp(name = ViewProps.ADJUSTS_FONT_SIZE_TO_FIT)
  public fun setAdjustFontSizeToFit(view: ReactTextView, adjustsFontSizeToFit: Boolean) {
    view.setAdjustFontSizeToFit(adjustsFontSizeToFit)
  }

  @ReactProp(name = ViewProps.FONT_SIZE)
  public fun setFontSize(view: ReactTextView, fontSize: Float) {
    view.setFontSize(fontSize)
  }

  @ReactProp(name = ViewProps.LETTER_SPACING, defaultFloat = 0f)
  public fun setLetterSpacing(view: ReactTextView, letterSpacing: Float) {
    view.letterSpacing = letterSpacing
  }

  @ReactProp(name = ViewProps.TEXT_ALIGN_VERTICAL)
  public fun setTextAlignVertical(view: ReactTextView, textAlignVertical: String?) {
    when (textAlignVertical) {
      null,
      "auto" -> view.setGravityVertical(Gravity.NO_GRAVITY)
      "top" -> view.setGravityVertical(Gravity.TOP)
      "bottom" -> view.setGravityVertical(Gravity.BOTTOM)
      "center" -> view.setGravityVertical(Gravity.CENTER_VERTICAL)
      else -> {
        FLog.w(ReactConstants.TAG, "Invalid textAlignVertical: $textAlignVertical")
        view.setGravityVertical(Gravity.NO_GRAVITY)
      }
    }
  }

  @ReactProp(name = "selectable")
  public fun setSelectable(view: ReactTextView, isSelectable: Boolean) {
    view.setTextIsSelectable(isSelectable)
  }

  @ReactProp(name = "selectionColor", customType = "Color")
  public fun setSelectionColor(view: ReactTextView, color: Int?) {
    view.highlightColor = color ?: getDefaultTextColorHighlight(view.context)
  }

  @ReactProp(name = "android_hyphenationFrequency")
  public fun setAndroidHyphenationFrequency(view: ReactTextView, frequency: String?) {
    when (frequency) {
      null,
      "none" -> view.hyphenationFrequency = Layout.HYPHENATION_FREQUENCY_NONE
      "full" -> view.hyphenationFrequency = Layout.HYPHENATION_FREQUENCY_FULL
      "normal" -> view.hyphenationFrequency = Layout.HYPHENATION_FREQUENCY_NORMAL
      else -> {
        FLog.w(ReactConstants.TAG, "Invalid android_hyphenationFrequency: $frequency")
        view.hyphenationFrequency = Layout.HYPHENATION_FREQUENCY_NONE
      }
    }
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.BORDER_RADIUS,
              ViewProps.BORDER_TOP_LEFT_RADIUS,
              ViewProps.BORDER_TOP_RIGHT_RADIUS,
              ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
              ViewProps.BORDER_BOTTOM_LEFT_RADIUS],
      defaultFloat = Float.NaN)
  public fun setBorderRadius(view: ReactTextView, index: Int, borderRadius: Float) {
    val radius =
        if (java.lang.Float.isNaN(borderRadius)) {
          null
        } else {
          LengthPercentage(borderRadius, LengthPercentageType.POINT)
        }
    BackgroundStyleApplicator.setBorderRadius(view, BorderRadiusProp.values()[index], radius)
  }

  @ReactProp(name = "borderStyle")
  public fun setBorderStyle(view: ReactTextView, borderStyle: String?) {
    val parsedBorderStyle = if (borderStyle == null) null else fromString(borderStyle)
    BackgroundStyleApplicator.setBorderStyle(view, parsedBorderStyle)
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.BORDER_WIDTH,
              ViewProps.BORDER_LEFT_WIDTH,
              ViewProps.BORDER_RIGHT_WIDTH,
              ViewProps.BORDER_TOP_WIDTH,
              ViewProps.BORDER_BOTTOM_WIDTH,
              ViewProps.BORDER_START_WIDTH,
              ViewProps.BORDER_END_WIDTH],
      defaultFloat = Float.NaN)
  public fun setBorderWidth(view: ReactTextView, index: Int, width: Float) {
    BackgroundStyleApplicator.setBorderWidth(view, LogicalEdge.values()[index], width)
  }

  @ReactPropGroup(
      names =
          [
              "borderColor",
              "borderLeftColor",
              "borderRightColor",
              "borderTopColor",
              "borderBottomColor"],
      customType = "Color")
  public fun setBorderColor(view: ReactTextView, index: Int, color: Int?) {
    BackgroundStyleApplicator.setBorderColor(view, LogicalEdge.values()[index], color)
  }

  @ReactProp(name = ViewProps.INCLUDE_FONT_PADDING, defaultBoolean = true)
  public fun setIncludeFontPadding(view: ReactTextView, includepad: Boolean) {
    view.includeFontPadding = includepad
  }

  @ReactProp(name = "disabled", defaultBoolean = false)
  public fun setDisabled(view: ReactTextView, disabled: Boolean) {
    view.isEnabled = !disabled
  }

  @ReactProp(name = "dataDetectorType")
  public fun setDataDetectorType(view: ReactTextView, type: String?) {
    when (type) {
      "phoneNumber" -> {
        view.setLinkifyMask(Linkify.PHONE_NUMBERS)
        return
      }
      "link" -> {
        view.setLinkifyMask(Linkify.WEB_URLS)
        return
      }
      "email" -> {
        view.setLinkifyMask(Linkify.EMAIL_ADDRESSES)
        return
      }
      "all" -> {
        @Suppress("DEPRECATION") view.setLinkifyMask(Linkify.ALL)
        return
      }
    }

    // "none" case, default, and null type are equivalent.
    view.setLinkifyMask(0)
  }
}
