package com.facebook.react.views.text;

import com.facebook.react.common.assets.ReactFontManager;
import com.facebook.react.uimanager.ReactAccessibilityDelegate;
import com.facebook.react.uimanager.ReactAccessibilityDelegate.Role;

/**
 * Interface for an entity providing effective text attributes of a text node/fragment
 */
public interface EffectiveTextAttributeProvider {
  int UNSET = ReactFontManager.TypefaceStyle.UNSET;

  TextTransform getTextTransform();

  float getEffectiveLetterSpacing();

  /**
   * @return The effective font size, or {@link #UNSET} if not set
   */
  int getEffectiveFontSize();

  Role getRole();

  ReactAccessibilityDelegate.AccessibilityRole getAccessibilityRole();

  boolean isBackgroundColorSet();

  int getBackgroundColor();

  boolean isColorSet();

  int getColor();

  int getFontStyle();

  int getFontWeight();

  String getFontFamily();

  String getFontFeatureSettings();

  boolean isUnderlineTextDecorationSet();

  boolean isLineThroughTextDecorationSet();

  float getTextShadowOffsetDx();

  float getTextShadowOffsetDy();

  float getTextShadowRadius();

  int getTextShadowColor();

  float getEffectiveLineHeight();
}
