package com.facebook.react.views.text

import com.facebook.react.common.assets.ReactFontManager

/**
 * Interface for an entity providing effective text attributes of a text node/fragment
 */
internal interface EffectiveTextAttributeProvider : BasicTextAttributeProvider {
  companion object {
    const val UNSET = ReactFontManager.TypefaceStyle.UNSET
  }

  val textTransform: TextTransform

  val effectiveLetterSpacing: Float

  /**
   * @return The effective font size, or [UNSET] if not set
   */
  val effectiveFontSize: Int

  val effectiveLineHeight: Float
}
