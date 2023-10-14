package com.facebook.react.views.text

import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.uimanager.ReactAccessibilityDelegate
import com.facebook.react.uimanager.ReactAccessibilityDelegate.Role

/**
 * Interface for an entity providing effective text attributes of a text node/fragment
 */
internal interface EffectiveTextAttributeProvider {
  companion object {
    const val UNSET = ReactFontManager.TypefaceStyle.UNSET
  }

  val textTransform: TextTransform

  val effectiveLetterSpacing: Float

  /**
   * @return The effective font size, or [UNSET] if not set
   */
  val effectiveFontSize: Int

  val role: Role?

  val accessibilityRole: ReactAccessibilityDelegate.AccessibilityRole?

  val isBackgroundColorSet: Boolean

  val backgroundColor: Int

  val isColorSet: Boolean

  val color: Int

  val fontStyle: Int

  val fontWeight: Int

  val fontFamily: String?

  val fontFeatureSettings: String?

  val isUnderlineTextDecorationSet: Boolean

  val isLineThroughTextDecorationSet: Boolean

  val textShadowOffsetDx: Float

  val textShadowOffsetDy: Float

  val textShadowRadius: Float

  val textShadowColor: Int

  val effectiveLineHeight: Float
}
