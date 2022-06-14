/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.content.Context;
import android.content.res.ColorStateList;
import android.content.res.Resources;
import android.content.res.TypedArray;

/** Utility class that access default values from style */
public final class DefaultStyleValuesUtil {

  private DefaultStyleValuesUtil() {
    throw new AssertionError("Never invoke this for an Utility class!");
  }

  /**
   * Utility method that returns the default text hint color as define by the theme
   *
   * @param context The Context
   * @return The ColorStateList for the hint text as defined in the style
   */
  public static ColorStateList getDefaultTextColorHint(Context context) {
    return getDefaultTextAttribute(context, android.R.attr.textColorHint);
  }

  /**
   * Utility method that returns the default text color as define by the theme
   *
   * @param context The Context
   * @return The ColorStateList for the text as defined in the style
   */
  public static ColorStateList getDefaultTextColor(Context context) {
    return getDefaultTextAttribute(context, android.R.attr.textColor);
  }

  /**
   * Utility method that returns the default text highlight color as define by the theme
   *
   * @param context The Context
   * @return The int for the highlight color as defined in the style
   */
  public static int getDefaultTextColorHighlight(Context context) {
    return getDefaultTextAttribute(context, android.R.attr.textColorHighlight).getDefaultColor();
  }

  private static ColorStateList getDefaultTextAttribute(Context context, int attribute) {
    Resources.Theme theme = context.getTheme();
    TypedArray textAppearances = null;
    try {
      textAppearances = theme.obtainStyledAttributes(new int[] {attribute});
      ColorStateList textColor = textAppearances.getColorStateList(0);
      return textColor;
    } finally {
      if (textAppearances != null) {
        textAppearances.recycle();
      }
    }
  }
}
