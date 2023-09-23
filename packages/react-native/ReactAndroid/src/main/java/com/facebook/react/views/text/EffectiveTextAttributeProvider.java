package com.facebook.react.views.text;

import com.facebook.react.uimanager.ReactAccessibilityDelegate;
import com.facebook.react.uimanager.ReactAccessibilityDelegate.Role;

/**
 * Interface for an entity providing effective text attributes of a text node/fragment
 */
public interface EffectiveTextAttributeProvider {
  TextTransform getTextTransform();

  float getEffectiveLetterSpacing();

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
