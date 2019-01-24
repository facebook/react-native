/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ViewDefaults;

/*
 * Currently, TextAttributes consists of a subset of text props that need to be passed from parent
 * to child so inheritance can be implemented correctly. An example complexity that causes a prop
 * to end up in TextAttributes is when multiple props need to be considered together to determine
 * the rendered aka effective value. For example, to figure out the rendered/effective font size,
 * you need to take into account the fontSize, maxFontSizeMultiplier, and allowFontScaling props.
 */
public class TextAttributes {
  // Setting the default to 0 indicates that there is no max.
  public static final float DEFAULT_MAX_FONT_SIZE_MULTIPLIER = 0.0f;

  private boolean mAllowFontScaling = true;
  private float mFontSize = Float.NaN;
  private float mLineHeight = Float.NaN;
  private float mLetterSpacing = Float.NaN;
  private float mMaxFontSizeMultiplier = Float.NaN;
  private float mHeightOfTallestInlineImage = Float.NaN;
  private TextTransform mTextTransform = TextTransform.UNSET;

  public TextAttributes() {
  }

  public TextAttributes applyChild(TextAttributes child) {
    TextAttributes result = new TextAttributes();

    // allowFontScaling is always determined by the root Text
    // component so don't allow the child to overwrite it.
    result.mAllowFontScaling = mAllowFontScaling;

    result.mFontSize = !Float.isNaN(child.mFontSize) ? child.mFontSize : mFontSize;
    result.mLineHeight = !Float.isNaN(child.mLineHeight) ? child.mLineHeight : mLineHeight;
    result.mLetterSpacing = !Float.isNaN(child.mLetterSpacing) ? child.mLetterSpacing : mLetterSpacing;
    result.mMaxFontSizeMultiplier = !Float.isNaN(child.mMaxFontSizeMultiplier) ? child.mMaxFontSizeMultiplier : mMaxFontSizeMultiplier;
    result.mHeightOfTallestInlineImage = !Float.isNaN(child.mHeightOfTallestInlineImage) ? child.mHeightOfTallestInlineImage : mHeightOfTallestInlineImage;
    result.mTextTransform = child.mTextTransform != TextTransform.UNSET ? child.mTextTransform : mTextTransform;

    return result;
  }

  // Getters and setters
  //

  public boolean getAllowFontScaling() {
    return mAllowFontScaling;
  }

  public void setAllowFontScaling(boolean value) {
    mAllowFontScaling = value;
  }

  public float getFontSize() {
    return mFontSize;
  }

  public void setFontSize(float value) {
    mFontSize = value;
  }

  public float getLineHeight() {
    return mLineHeight;
  }

  public void setLineHeight(float value) {
    mLineHeight = value;
  }

  public float getLetterSpacing() {
    return mLetterSpacing;
  }

  public void setLetterSpacing(float value) {
    mLetterSpacing = value;
  }

  public float getMaxFontSizeMultiplier() {
    return mMaxFontSizeMultiplier;
  }

  public void setMaxFontSizeMultiplier(float maxFontSizeMultiplier) {
    if (maxFontSizeMultiplier != 0 && maxFontSizeMultiplier < 1) {
      throw new JSApplicationIllegalArgumentException("maxFontSizeMultiplier must be NaN, 0, or >= 1");
    }
    mMaxFontSizeMultiplier = maxFontSizeMultiplier;
  }

  public float getHeightOfTallestInlineImage() {
    return mHeightOfTallestInlineImage;
  }

  public void setHeightOfTallestInlineImage(float value) {
    mHeightOfTallestInlineImage = value;
  }

  public TextTransform getTextTransform() {
    return mTextTransform;
  }

  public void setTextTransform(TextTransform textTransform) {
    mTextTransform = textTransform;
  }

  // Getters for effective values
  //
  // In general, these return `Float.NaN` if the property doesn't have a value.
  //

  // Always returns a value because uses a hardcoded default as a fallback.
  public int getEffectiveFontSize() {
    float fontSize = !Float.isNaN(mFontSize) ? mFontSize : ViewDefaults.FONT_SIZE_SP;
    return mAllowFontScaling
      ? (int) Math.ceil(PixelUtil.toPixelFromSP(fontSize, getEffectiveMaxFontSizeMultiplier()))
      : (int) Math.ceil(PixelUtil.toPixelFromDIP(fontSize));
  }

  public float getEffectiveLineHeight() {
    if (Float.isNaN(mLineHeight)) {
      return Float.NaN;
    }

    float lineHeight = mAllowFontScaling
      ? PixelUtil.toPixelFromSP(mLineHeight, getEffectiveMaxFontSizeMultiplier())
      : PixelUtil.toPixelFromDIP(mLineHeight);

    // Take into account the requested line height
    // and the height of the inline images.
    boolean useInlineViewHeight =
      !Float.isNaN(mHeightOfTallestInlineImage)
        && mHeightOfTallestInlineImage > lineHeight;
    return useInlineViewHeight ? mHeightOfTallestInlineImage : lineHeight;
  }

  public float getEffectiveLetterSpacing() {
    if (Float.isNaN(mLetterSpacing)) {
      return Float.NaN;
    }

    float letterSpacingPixels = mAllowFontScaling
      ? PixelUtil.toPixelFromSP(mLetterSpacing, getEffectiveMaxFontSizeMultiplier())
      : PixelUtil.toPixelFromDIP(mLetterSpacing);

    // `letterSpacingPixels` and `getEffectiveFontSize` are both in pixels,
    // yielding an accurate em value.
    return letterSpacingPixels / getEffectiveFontSize();
  }

  // Never returns NaN
  public float getEffectiveMaxFontSizeMultiplier() {
    return !Float.isNaN(mMaxFontSizeMultiplier)
      ? mMaxFontSizeMultiplier
      : DEFAULT_MAX_FONT_SIZE_MULTIPLIER;
  }

  public String toString() {
    return (
      "TextAttributes {"
      + "\n  getAllowFontScaling(): " + getAllowFontScaling()
      + "\n  getFontSize(): " + getFontSize()
      + "\n  getEffectiveFontSize(): " + getEffectiveFontSize()
      + "\n  getHeightOfTallestInlineImage(): " + getHeightOfTallestInlineImage()
      + "\n  getLetterSpacing(): " + getLetterSpacing()
      + "\n  getEffectiveLetterSpacing(): " + getEffectiveLetterSpacing()
      + "\n  getLineHeight(): " + getLineHeight()
      + "\n  getEffectiveLineHeight(): " + getEffectiveLineHeight()
      + "\n  getTextTransform(): " + getTextTransform()
      + "\n  getMaxFontSizeMultiplier(): " + getMaxFontSizeMultiplier()
      + "\n  getEffectiveMaxFontSizeMultiplier(): " + getEffectiveMaxFontSizeMultiplier()
      + "\n}"
    );
  }
}
