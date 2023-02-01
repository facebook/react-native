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

  private static final String TAG = "CustomStyleSpan";
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
  private int mSize = 0;
  private TextAlignVertical mTextAlignVertical = TextAlignVertical.CENTER;
  private int mHighestLineHeight = 0;
  private int mHighestFontSize = 0;
  private String mCurrentText;

  public CustomStyleSpan(
      int fontStyle,
      int fontWeight,
      @Nullable String fontFeatureSettings,
      @Nullable String fontFamily,
      AssetManager assetManager) {
    mStyle = fontStyle;
    mWeight = fontWeight;
    mFeatureSettings = fontFeatureSettings;
    mFontFamily = fontFamily;
    mAssetManager = assetManager;
  }

  public CustomStyleSpan(
      int fontStyle,
      int fontWeight,
      @Nullable String fontFeatureSettings,
      @Nullable String fontFamily,
      TextAlignVertical textAlignVertical,
      int textSize,
      AssetManager assetManager,
      String currentText) {
    this(fontStyle, fontWeight, fontFeatureSettings, fontFamily, assetManager);
    mTextAlignVertical = textAlignVertical;
    mSize = textSize;
    mCurrentText = currentText;
  }

  public enum TextAlignVertical {
    TOP,
    BOTTOM,
    CENTER,
  }

  public TextAlignVertical getTextAlignVertical() {
    return mTextAlignVertical;
  }

  public int getSize() {
    return mSize;
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
        mSize,
        mHighestLineHeight,
        mHighestFontSize,
        mCurrentText);
  }

  @Override
  public void updateMeasureState(TextPaint paint) {
    apply(
        paint,
        mStyle,
        mWeight,
        mFeatureSettings,
        mFontFamily,
        mAssetManager,
        mTextAlignVertical,
        mSize,
        mHighestLineHeight,
        mHighestFontSize,
        mCurrentText);
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
      TextPaint ds,
      int style,
      int weight,
      @Nullable String fontFeatureSettings,
      @Nullable String family,
      AssetManager assetManager,
      TextAlignVertical textAlignVertical,
      int textSize,
      int highestLineHeight,
      int highestFontSize,
      String currentText) {
    Typeface typeface =
        ReactTypefaceUtils.applyStyles(ds.getTypeface(), style, weight, family, assetManager);
    ds.setFontFeatureSettings(fontFeatureSettings);
    ds.setTypeface(typeface);
    ds.setSubpixelText(true);

    if (textAlignVertical == TextAlignVertical.CENTER) {
      return;
    }

    TextPaint textPaintCopy = new TextPaint();
    textPaintCopy.set(ds);
    if (textSize > 0) {
      textPaintCopy.setTextSize(textSize);
    }
    if (highestLineHeight == 0) {
      // aligns the text by font metrics
      // when lineHeight prop is missing
      // https://stackoverflow.com/a/27631737/7295772
      // top      -------------  -10
      // ascent   -------------  -5
      // baseline __my Text____   0
      // descent  _____________   2
      // bottom   _____________   5
      if (textAlignVertical == TextAlignVertical.TOP) {
        ds.baselineShift +=
            textPaintCopy.getFontMetrics().top - textPaintCopy.ascent() - textPaintCopy.descent();
      }
      if (textAlignVertical == TextAlignVertical.BOTTOM) {
        ds.baselineShift += textPaintCopy.getFontMetrics().bottom - textPaintCopy.descent();
      }
    } else {
      if (textSize == highestFontSize) {
        // aligns text vertically in the lineHeight
        // and adjust their position depending on the fontSize
        if (textAlignVertical == TextAlignVertical.TOP) {
          ds.baselineShift -= highestLineHeight / 2 - textPaintCopy.getTextSize() / 2;
        }
        if (textAlignVertical == TextAlignVertical.BOTTOM) {
          ds.baselineShift +=
              highestLineHeight / 2 - textPaintCopy.getTextSize() / 2 - textPaintCopy.descent();
        }
      } else if (highestFontSize != 0 && textSize < highestFontSize) {
        // aligns correctly text that has smaller font
        if (textAlignVertical == TextAlignVertical.TOP) {
          ds.baselineShift -=
              highestLineHeight / 2
                  - highestFontSize / 2
                  // smaller font aligns on the baseline of bigger font
                  // moves the baseline of text with smaller font up
                  // so it aligns on the top of the larger font
                  + (highestFontSize - textSize)
                  + (textPaintCopy.getFontMetrics().top - textPaintCopy.ascent());
        }
        if (textAlignVertical == TextAlignVertical.BOTTOM) {
          ds.baselineShift += highestLineHeight / 2 - highestFontSize / 2 - textPaintCopy.descent();
        }
      }
    }
  }

  public void updateSpan(int highestLineHeight, int highestFontSize) {
    mHighestLineHeight = highestLineHeight;
    mHighestFontSize = highestFontSize;
  }
}
