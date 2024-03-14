/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span;

import android.content.res.AssetManager;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.text.TextPaint;
import android.text.style.MetricAffectingSpan;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.assets.ReactFontManager;
import com.facebook.react.views.text.ReactTypefaceUtils;

/**
 * A {@link MetricAffectingSpan} that allows to change the style of the displayed font.
 * CustomStyleSpan will try to load the fontFamily with the right style and weight from the assets.
 * The custom fonts will have to be located in the res/assets folder of the application. The
 * supported custom fonts extensions are .ttf and .otf. For each font family the bold, italic and
 * bold_italic variants are supported. Given a "family" font family the files in the assets/fonts
 * folder need to be family.ttf(.otf) family_bold.ttf(.otf) family_italic.ttf(.otf) and
 * family_bold_italic.ttf(.otf). If the right font is not found in the assets folder CustomStyleSpan
 * will fallback on the most appropriate default typeface depending on the style. Fonts are
 * retrieved and cached using the {@link ReactFontManager}
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class CustomStyleSpan extends MetricAffectingSpan implements ReactSpan {
  private final AssetManager mAssetManager;

  private final int mStyle;
  private final int mWeight;
  private final @Nullable String mFeatureSettings;
  private final @Nullable String mFontFamily;

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

  @Override
  public void updateDrawState(TextPaint ds) {
    apply(ds, mStyle, mWeight, mFeatureSettings, mFontFamily, mAssetManager);
  }

  @Override
  public void updateMeasureState(TextPaint paint) {
    apply(paint, mStyle, mWeight, mFeatureSettings, mFontFamily, mAssetManager);
  }

  public int getStyle() {
    return mStyle == ReactConstants.UNSET ? Typeface.NORMAL : mStyle;
  }

  public int getWeight() {
    return mWeight == ReactConstants.UNSET ? ReactFontManager.TypefaceStyle.NORMAL : mWeight;
  }

  public @Nullable String getFontFamily() {
    return mFontFamily;
  }

  public @Nullable String getFontFeatureSettings() {
    return mFeatureSettings;
  }

  private static void apply(
      Paint paint,
      int style,
      int weight,
      @Nullable String fontFeatureSettings,
      @Nullable String family,
      AssetManager assetManager) {
    Typeface typeface =
        ReactTypefaceUtils.applyStyles(paint.getTypeface(), style, weight, family, assetManager);
    paint.setFontFeatureSettings(fontFeatureSettings);
    paint.setTypeface(typeface);
    paint.setSubpixelText(true);
  }
}
