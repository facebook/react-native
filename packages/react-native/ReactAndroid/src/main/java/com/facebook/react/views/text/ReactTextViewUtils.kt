package com.facebook.react.views.text

import android.graphics.Typeface
import android.widget.TextView

internal fun TextView.findEffectiveTypeface(
   fontFamily: String?,
   fontStyle: Int,
   fontWeight: Int,
): Typeface = ReactTypefaceUtils.applyStyles(
  typeface,
  fontStyle,
  fontWeight,
  fontFamily,
  context.assets,
)
