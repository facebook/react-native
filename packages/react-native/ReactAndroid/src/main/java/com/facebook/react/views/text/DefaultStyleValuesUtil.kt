/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Suppress unused import warning to ensure the correct `use` extension is applied.
// Removing [androidx.core.content.res.use] import causes Kotlin to fallback to `kotlin.io.use`,
// which expects `AutoCloseable`.
// However, `TypedArray` is not `AutoCloseable`, and this mismatch can lead to crashes like
// IncompatibleClassChangeError.
@file:Suppress("UnusedImport")

package com.facebook.react.views.text

import android.content.Context
import android.content.res.ColorStateList
import androidx.core.content.res.use

/** Utility class that access default values from style */
public object DefaultStyleValuesUtil {

  /**
   * Utility method that returns the default text hint color as define by the theme
   *
   * @param context The Context
   * @return The ColorStateList for the hint text as defined in the style
   */
  @JvmStatic
  public fun getDefaultTextColorHint(context: Context): ColorStateList? =
      getDefaultTextAttribute(context, android.R.attr.textColorHint)

  /**
   * Utility method that returns the default text color as define by the theme
   *
   * @param context The Context
   * @return The ColorStateList for the text as defined in the style
   */
  @JvmStatic
  public fun getDefaultTextColor(context: Context): ColorStateList? =
      getDefaultTextAttribute(context, android.R.attr.textColor)

  @JvmStatic
  public fun getTextColorSecondary(context: Context): ColorStateList? =
      getDefaultTextAttribute(context, android.R.attr.textColorSecondary)

  /**
   * Utility method that returns the default text highlight color as define by the theme
   *
   * @param context The Context
   * @return The int for the highlight color as defined in the style
   */
  @JvmStatic
  public fun getDefaultTextColorHighlight(context: Context): Int =
      getDefaultTextAttribute(context, android.R.attr.textColorHighlight)?.defaultColor
          ?: 0 // if the highlight color is not defined in the theme, return black

  private fun getDefaultTextAttribute(context: Context, attribute: Int): ColorStateList? {
    context.theme.obtainStyledAttributes(intArrayOf(attribute)).use { typedArray ->
      return typedArray.getColorStateList(0)
    }
  }
}
