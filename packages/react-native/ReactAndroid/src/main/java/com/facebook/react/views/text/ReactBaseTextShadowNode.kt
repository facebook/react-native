/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.text

import android.text.Spannable
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * [ReactShadowNode] abstract class for spannable text nodes.
 *
 * This class handles all text attributes associated with `<Text>`-ish node. A concrete node can be
 * an anchor `<Text>` node, an anchor `<TextInput>` node or virtual `<Text>` node inside `<Text>` or
 * `<TextInput>` node. Or even something else.
 *
 * This also node calculates [Spannable] object based on sub nodes of the same type, which can be
 * used in concrete classes to feed native views and compute layout.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release"
)
public abstract class ReactBaseTextShadowNode
@JvmOverloads
public constructor(
    protected var reactTextViewManagerCallback: ReactTextViewManagerCallback? = null
) : LayoutShadowNode() {
  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.NUMBER_OF_LINES, defaultInt = ReactConstants.UNSET)
  public fun setNumberOfLines(numberOfLines: Int) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.LINE_HEIGHT, defaultFloat = Float.NaN)
  public fun setLineHeight(lineHeight: Float) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.LETTER_SPACING, defaultFloat = 0f)
  public fun setLetterSpacing(letterSpacing: Float) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.ALLOW_FONT_SCALING, defaultBoolean = true)
  public fun setAllowFontScaling(allowFontScaling: Boolean) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.MAX_FONT_SIZE_MULTIPLIER, defaultFloat = Float.NaN)
  public fun setMaxFontSizeMultiplier(maxFontSizeMultiplier: Float) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.TEXT_ALIGN)
  public fun setTextAlign(textAlign: String?) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.FONT_SIZE, defaultFloat = Float.NaN)
  public fun setFontSize(fontSize: Float) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  public fun setColor(color: Int?) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.BACKGROUND_COLOR, customType = "Color")
  public fun setBackgroundColor(color: Int?) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.ACCESSIBILITY_ROLE)
  public fun setAccessibilityRole(accessibilityRole: String?) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.ROLE)
  public fun setRole(role: String?) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.FONT_FAMILY)
  public fun setFontFamily(fontFamily: String?) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.FONT_WEIGHT)
  public fun setFontWeight(fontWeightString: String?) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.FONT_VARIANT)
  public fun setFontVariant(fontVariantArray: ReadableArray?) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.FONT_STYLE)
  public fun setFontStyle(fontStyleString: String?) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.INCLUDE_FONT_PADDING, defaultBoolean = true)
  public fun setIncludeFontPadding(includepad: Boolean) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.TEXT_DECORATION_LINE)
  public fun setTextDecorationLine(textDecorationLineString: String?) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.TEXT_BREAK_STRATEGY)
  public open fun setTextBreakStrategy(textBreakStrategy: String?) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = PROP_SHADOW_OFFSET)
  public fun setTextShadowOffset(offsetMap: ReadableMap?) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = PROP_SHADOW_RADIUS, defaultInt = 1)
  public fun setTextShadowRadius(textShadowRadius: Float) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = PROP_SHADOW_COLOR, defaultInt = DEFAULT_TEXT_SHADOW_COLOR, customType = "Color")
  public fun setTextShadowColor(textShadowColor: Int) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = PROP_TEXT_TRANSFORM)
  public fun setTextTransform(textTransform: String?) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.ADJUSTS_FONT_SIZE_TO_FIT)
  public fun setAdjustFontSizeToFit(adjustsFontSizeToFit: Boolean) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = ViewProps.MINIMUM_FONT_SCALE)
  public fun setMinimumFontScale(minimumFontScale: Float) {
    error(
        "ReactBaseTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  public companion object {
    public const val PROP_SHADOW_OFFSET: String = "textShadowOffset"
    public const val PROP_SHADOW_OFFSET_WIDTH: String = "width"
    public const val PROP_SHADOW_OFFSET_HEIGHT: String = "height"
    public const val PROP_SHADOW_RADIUS: String = "textShadowRadius"
    public const val PROP_SHADOW_COLOR: String = "textShadowColor"

    public const val PROP_TEXT_TRANSFORM: String = "textTransform"

    public const val DEFAULT_TEXT_SHADOW_COLOR: Int = 0x55000000
  }
}
