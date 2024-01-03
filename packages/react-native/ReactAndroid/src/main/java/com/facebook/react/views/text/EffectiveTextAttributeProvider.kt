package com.facebook.react.views.text

import com.facebook.react.common.IntConstants.UNSET

/**
 * Interface for an entity providing effective text attributes of a text node/fragment
 */
internal interface EffectiveTextAttributeProvider : BasicTextAttributeProvider {
  val textTransform: TextTransform

  val effectiveLetterSpacing: Float

  /**
   * @return The effective font size, or [UNSET] if not set
   */
  val effectiveFontSize: Int

  val effectiveLineHeight: Float
}
