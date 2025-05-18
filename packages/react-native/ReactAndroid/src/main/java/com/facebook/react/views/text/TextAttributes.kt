/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ViewDefaults

/*
 * Currently, TextAttributes consists of a subset of text props that need to be passed from parent
 * to child so inheritance can be implemented correctly. An example complexity that causes a prop
 * to end up in TextAttributes is when multiple props need to be considered together to determine
 * the rendered aka effective value. For example, to figure out the rendered/effective font size,
 * you need to take into account the fontSize, maxFontSizeMultiplier, and allowFontScaling props.
 */
public class TextAttributes {
  public var allowFontScaling: Boolean = true
  public var fontSize: Float = Float.NaN
  public var lineHeight: Float = Float.NaN
  public var letterSpacing: Float = Float.NaN
  private var internalMaxFontSizeMultiplier = Float.NaN
  public var heightOfTallestInlineViewOrImage: Float = Float.NaN
  public var textTransform: TextTransform = TextTransform.UNSET

  public fun applyChild(child: TextAttributes): TextAttributes {
    val result = TextAttributes()

    // allowFontScaling is always determined by the root Text
    // component so don't allow the child to overwrite it.
    result.allowFontScaling = allowFontScaling

    result.fontSize = if (!java.lang.Float.isNaN(child.fontSize)) child.fontSize else fontSize
    result.lineHeight =
      if (!java.lang.Float.isNaN(child.lineHeight)) child.lineHeight else lineHeight
    result.letterSpacing =
      if (!java.lang.Float.isNaN(child.letterSpacing)) child.letterSpacing else letterSpacing
    result.internalMaxFontSizeMultiplier =
      if (!java.lang.Float.isNaN(child.internalMaxFontSizeMultiplier))
        child.internalMaxFontSizeMultiplier
      else
        internalMaxFontSizeMultiplier
    result.heightOfTallestInlineViewOrImage =
      if (!java.lang.Float.isNaN(child.heightOfTallestInlineViewOrImage))
        child.heightOfTallestInlineViewOrImage
      else
        heightOfTallestInlineViewOrImage
    result.textTransform =
      if (child.textTransform != TextTransform.UNSET) child.textTransform else textTransform

    return result
  }

  public var maxFontSizeMultiplier: Float
    get() = internalMaxFontSizeMultiplier
    set(maxFontSizeMultiplier) {
      if (maxFontSizeMultiplier != 0f && maxFontSizeMultiplier < 1) {
        FLog.w(ReactConstants.TAG, "maxFontSizeMultiplier must be NaN, 0, or >= 1")
        internalMaxFontSizeMultiplier = Float.NaN
        return
      }
      internalMaxFontSizeMultiplier = maxFontSizeMultiplier
    }

  public val effectiveFontSize: Int
    get() {
      val fontSize =
        if (!java.lang.Float.isNaN(fontSize)) fontSize else ViewDefaults.FONT_SIZE_SP
      return if (allowFontScaling)
        Math.ceil(
          PixelUtil.toPixelFromSP(
            fontSize,
            effectiveMaxFontSizeMultiplier
          ).toDouble()
        ).toInt()
      else
        Math.ceil(PixelUtil.toPixelFromDIP(fontSize).toDouble()).toInt()
    }

  public val effectiveLineHeight: Float
    get() {
      if (java.lang.Float.isNaN(lineHeight)) {
        return Float.NaN
      }

      val lineHeight: Float =
        if (allowFontScaling)
          PixelUtil.toPixelFromSP(lineHeight, effectiveMaxFontSizeMultiplier)
        else
          PixelUtil.toPixelFromDIP(lineHeight)

        // Take into account the requested line height
        // and the height of the inline images.
        val useInlineViewHeight =
          !java.lang.Float.isNaN(heightOfTallestInlineViewOrImage)
            && heightOfTallestInlineViewOrImage > lineHeight
        return if (useInlineViewHeight) heightOfTallestInlineViewOrImage else lineHeight
    }

  public val effectiveLetterSpacing: Float
    get() {
      if (java.lang.Float.isNaN(letterSpacing)) {
        return Float.NaN
      }

      val letterSpacingPixels: Float =
        if (allowFontScaling)
          PixelUtil.toPixelFromSP(letterSpacing, effectiveMaxFontSizeMultiplier)
        else
          PixelUtil.toPixelFromDIP(letterSpacing)

      // `letterSpacingPixels` and `getEffectiveFontSize` are both in pixels,
      // yielding an accurate em value.
      return letterSpacingPixels / effectiveFontSize
    }

  public val effectiveMaxFontSizeMultiplier: Float
    // Never returns NaN
    get() =
      if (!java.lang.Float.isNaN(internalMaxFontSizeMultiplier)) internalMaxFontSizeMultiplier
      else DEFAULT_MAX_FONT_SIZE_MULTIPLIER

  override fun toString(): String = """
    TextAttributes {
      getAllowFontScaling(): $allowFontScaling
      getFontSize(): $fontSize
      getEffectiveFontSize(): $effectiveFontSize
      getHeightOfTallestInlineViewOrImage(): $heightOfTallestInlineViewOrImage
      getLetterSpacing(): $letterSpacing
      getEffectiveLetterSpacing(): $effectiveLetterSpacing
      getLineHeight(): $lineHeight
      getEffectiveLineHeight(): $effectiveLineHeight
      getTextTransform(): $textTransform
      getMaxFontSizeMultiplier(): $maxFontSizeMultiplier
      getEffectiveMaxFontSizeMultiplier(): $effectiveMaxFontSizeMultiplier
    }
  """.trimIndent()

  public companion object {
    // Setting the default to 0 indicates that there is no max.
    public const val DEFAULT_MAX_FONT_SIZE_MULTIPLIER: Float = 0.0f
  }
}
