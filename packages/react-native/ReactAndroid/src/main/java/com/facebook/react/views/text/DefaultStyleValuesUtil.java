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
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;

/** Utility class that access default values from style */
@Nullsafe(Nullsafe.Mode.LOCAL)
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
  @Nullable
  public static ColorStateList getDefaultTextColorHint(Context context) {
    return getDefaultTextAttribute(context, android.R.attr.textColorHint);
  }

  /**
   * Utility method that returns the default text color as define by the theme
   *
   * @param context The Context
   * @return The ColorStateList for the text as defined in the style
   */
  @Nullable
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
    ColorStateList defaultTextAttribute =
        getDefaultTextAttribute(context, android.R.attr.textColorHighlight);
    if (defaultTextAttribute == null) {
      // it would be rare that the highlight color is not defined in the theme,
      // but if it is, return black
      return 0;
    }
    return defaultTextAttribute.getDefaultColor();
  }

  @Nullable
  private static ColorStateList getDefaultTextAttribute(Context context, int attribute) {
    Resources.Theme theme = context.getTheme();
    TypedArray textAppearances = null;
    try {
      textAppearances = theme.obtainStyledAttributes(new int[] {attribute});
      return textAppearances.getColorStateList(0);
    } finally {
      if (textAppearances != null) {
        textAppearances.recycle();
      }
    }
  }
}
