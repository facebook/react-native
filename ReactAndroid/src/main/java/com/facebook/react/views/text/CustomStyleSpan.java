/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.content.res.AssetManager;
import android.graphics.Typeface;
import android.text.TextPaint;
import android.text.style.MetricAffectingSpan;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class CustomStyleSpan extends MetricAffectingSpan implements ReactSpan {

  /**
   * A {@link MetricAffectingSpan} that allows to change the style of the displayed font.
   * CustomStyleSpan will try to load the fontFamily with the right style and weight from the
   * assets. The custom fonts will have to be located in the res/assets folder of the application.
   * The supported custom fonts extensions are .ttf and .otf. For each font family the bold, italic
   * and bold_italic variants are supported. Given a "family" font family the files in the
   * assets/fonts folder need to be family.ttf(.otf) family_bold.ttf(.otf) family_italic.ttf(.otf)
   * and family_bold_italic.ttf(.otf). If the right font is not found in the assets folder
   * CustomStyleSpan will fallback on the most appropriate default typeface depending on the style.
   * Fonts are retrieved and cached using the {@link ReactFontManager}
   */
  private final AssetManager mAssetManager;

  private final int mStyle;
  private final int mWeight;
  private final @Nullable String mFeatureSettings;
  private final @Nullable String mFontFamily;
  private String mTextAlignVertical;
  private int mHighestLineHeight;

  public CustomStyleSpan(
      int fontStyle,
      int fontWeight,
      @Nullable String fontFeatureSettings,
      @Nullable String fontFamily,
      AssetManager assetManager,
      @Nullable String textAlignVertical) {
    mStyle = fontStyle;
    mWeight = fontWeight;
    mFeatureSettings = fontFeatureSettings;
    mFontFamily = fontFamily;
    mAssetManager = assetManager;
    mTextAlignVertical = textAlignVertical;
  }

  @Override
  public void updateDrawState(TextPaint ds) {
    apply(
        ds,
        mStyle,
        mWeight,
        mFeatureSettings,
        mFontFamily,
        mAssetManager,
        mTextAlignVertical,
        mHighestLineHeight);
  }

  @Override
  public void updateMeasureState(TextPaint tp) {
    apply(
        tp,
        mStyle,
        mWeight,
        mFeatureSettings,
        mFontFamily,
        mAssetManager,
        mTextAlignVertical,
        mHighestLineHeight);
  }

  public int getStyle() {
    return mStyle == ReactBaseTextShadowNode.UNSET ? Typeface.NORMAL : mStyle;
  }

  public int getWeight() {
    return mWeight == ReactBaseTextShadowNode.UNSET ? TypefaceStyle.NORMAL : mWeight;
  }

  public @Nullable String getFontFamily() {
    return mFontFamily;
  }

  private static void apply(
      TextPaint tp,
      int style,
      int weight,
      @Nullable String fontFeatureSettings,
      @Nullable String family,
      AssetManager assetManager,
      @Nullable String textAlignVertical,
      int highestLineHeight) {
    Typeface typeface =
        ReactTypefaceUtils.applyStyles(tp.getTypeface(), style, weight, family, assetManager);
    tp.setFontFeatureSettings(fontFeatureSettings);
    tp.setTypeface(typeface);
    tp.setSubpixelText(true);

    // works only when lineHeight is defined with a prop
    // other use cases will be added in separate PRs
    // the span with the highest lineHeight sets the height for all rows
    if (textAlignVertical == "top-child" && highestLineHeight != 0) {
      tp.baselineShift -= highestLineHeight / 2 - tp.getTextSize() / 2;
    }
    if (textAlignVertical == "bottom-child" && highestLineHeight != 0) {
      tp.baselineShift += highestLineHeight / 2 - tp.getTextSize() / 2;
    }
  }

  public void updateSpan(int highestLineHeight) {
    mHighestLineHeight = highestLineHeight;
  }
}
