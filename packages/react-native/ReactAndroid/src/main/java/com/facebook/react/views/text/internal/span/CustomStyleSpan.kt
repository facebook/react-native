/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.content.res.AssetManager
import android.graphics.Paint
import android.graphics.Typeface
import android.os.Build
import android.text.TextPaint
import android.text.style.MetricAffectingSpan
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.views.text.ReactTypefaceUtils

/**
 * A [MetricAffectingSpan] that allows to change the style of the displayed font. CustomStyleSpan
 * will try to load the fontFamily with the right style and weight from the assets. The custom fonts
 * will have to be located in the res/assets folder of the application. The supported custom fonts
 * extensions are .ttf and .otf. For each font family the bold, italic and bold_italic variants are
 * supported. Given a "family" font family the files in the assets/fonts folder need to be
 * family.ttf(.otf) family_bold.ttf(.otf) family_italic.ttf(.otf) and family_bold_italic.ttf(.otf).
 * If the right font is not found in the assets folder CustomStyleSpan will fallback on the most
 * appropriate default typeface depending on the style. Fonts are retrieved and cached using the
 * [ReactFontManager]
 */
public class CustomStyleSpan(
    private val privateStyle: Int,
    private val privateWeight: Int,
    public val fontFeatureSettings: String?,
    public val fontFamily: String?,
    public val fontVariationSettings: String?,
    private val assetManager: AssetManager
) : MetricAffectingSpan(), ReactSpan {
  public override fun updateDrawState(ds: TextPaint) {
    apply(ds, privateStyle, privateWeight, fontFeatureSettings, fontFamily, fontVariationSettings, assetManager)
  }

  public override fun updateMeasureState(paint: TextPaint) {
    apply(paint, privateStyle, privateWeight, fontFeatureSettings, fontFamily, fontVariationSettings, assetManager)
  }

  public val style: Int
    get() =
        if (privateStyle == ReactConstants.UNSET) {
          Typeface.NORMAL
        } else {
          privateStyle
        }

  public val weight: Int
    get() =
        if (privateWeight == ReactConstants.UNSET) {
          ReactFontManager.TypefaceStyle.NORMAL
        } else {
          privateWeight
        }

  public companion object {
    private fun apply(
        paint: Paint,
        style: Int,
        weight: Int,
        fontFeatureSettingsParam: String?,
        family: String?,
        fontVariationSettingsParam: String?,
        assetManager: AssetManager
    ) {
      val typeface =
          ReactTypefaceUtils.applyStyles(paint.typeface, style, weight, family, assetManager)
      paint.apply {
        fontFeatureSettings = fontFeatureSettingsParam
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          fontVariationSettings = fontVariationSettingsParam
        }
        setTypeface(typeface)
        isSubpixelText = true
      }
    }
  }
}
