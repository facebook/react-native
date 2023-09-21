/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.content.res.AssetManager;
import android.graphics.Typeface;
import android.text.TextUtils;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.assets.ReactFontManager;
import java.util.ArrayList;
import java.util.List;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactTypefaceUtils {

  public static int parseFontWeight(@Nullable String fontWeightString) {
    if (fontWeightString != null) {
      switch (fontWeightString) {
        case "100":
          return 100;
        case "200":
          return 200;
        case "300":
          return 300;
        case "normal":
        case "400":
          return 400;
        case "500":
          return 500;
        case "600":
          return 600;
        case "bold":
        case "700":
          return 700;
        case "800":
          return 800;
        case "900":
          return 900;
      }
    }
    return ReactFontManager.TypefaceStyle.UNSET;
  }

  public static int parseFontStyle(@Nullable String fontStyleString) {
    if (fontStyleString != null) {
      if ("italic".equals(fontStyleString)) {
        return Typeface.ITALIC;
      }
      if ("normal".equals(fontStyleString)) {
        return Typeface.NORMAL;
      }
    }
    return ReactFontManager.TypefaceStyle.UNSET;
  }

  public static @Nullable String parseFontVariant(@Nullable ReadableArray fontVariantArray) {
    if (fontVariantArray == null || fontVariantArray.size() == 0) {
      return null;
    }

    List<String> features = new ArrayList<>();
    for (int i = 0; i < fontVariantArray.size(); i++) {
      // see https://docs.microsoft.com/en-us/typography/opentype/spec/featurelist
      String fontVariant = fontVariantArray.getString(i);
      if (fontVariant != null) {
        switch (fontVariant) {
          case "small-caps":
            features.add("'smcp'");
            break;
          case "oldstyle-nums":
            features.add("'onum'");
            break;
          case "lining-nums":
            features.add("'lnum'");
            break;
          case "tabular-nums":
            features.add("'tnum'");
            break;
          case "proportional-nums":
            features.add("'pnum'");
            break;
          case "common-ligatures":
            features.add("'liga'");
            features.add("'clig'");
            break;
          case "no-common-ligatures":
            features.add("'liga' off");
            features.add("'clig' off");
            break;
          case "discretionary-ligatures":
            features.add("'dlig'");
            break;
          case "no-discretionary-ligatures":
            features.add("'dlig' off");
            break;
          case "historical-ligatures":
            features.add("'hlig'");
            break;
          case "no-historical-ligatures":
            features.add("'hlig' off");
            break;
          case "contextual":
            features.add("'calt'");
            break;
          case "no-contextual":
            features.add("'calt' off");
            break;
          case "stylistic-one":
            features.add("'ss01'");
            break;
          case "stylistic-two":
            features.add("'ss02'");
            break;
          case "stylistic-three":
            features.add("'ss03'");
            break;
          case "stylistic-four":
            features.add("'ss04'");
            break;
          case "stylistic-five":
            features.add("'ss05'");
            break;
          case "stylistic-six":
            features.add("'ss06'");
            break;
          case "stylistic-seven":
            features.add("'ss07'");
            break;
          case "stylistic-eight":
            features.add("'ss08'");
            break;
          case "stylistic-nine":
            features.add("'ss09'");
            break;
          case "stylistic-ten":
            features.add("'ss10'");
            break;
          case "stylistic-eleven":
            features.add("'ss11'");
            break;
          case "stylistic-twelve":
            features.add("'ss12'");
            break;
          case "stylistic-thirteen":
            features.add("'ss13'");
            break;
          case "stylistic-fourteen":
            features.add("'ss14'");
            break;
          case "stylistic-fifteen":
            features.add("'ss15'");
            break;
          case "stylistic-sixteen":
            features.add("'ss16'");
            break;
          case "stylistic-seventeen":
            features.add("'ss17'");
            break;
          case "stylistic-eighteen":
            features.add("'ss18'");
            break;
          case "stylistic-nineteen":
            features.add("'ss19'");
            break;
          case "stylistic-twenty":
            features.add("'ss20'");
            break;
        }
      }
    }

    return TextUtils.join(", ", features);
  }

  public static Typeface applyStyles(
      @Nullable Typeface typeface,
      int style,
      int weight,
      @Nullable String fontFamilyName,
      AssetManager assetManager) {
    ReactFontManager.TypefaceStyle typefaceStyle =
        new ReactFontManager.TypefaceStyle(style, weight);
    if (fontFamilyName == null) {
      return typefaceStyle.apply(typeface == null ? Typeface.DEFAULT : typeface);
    } else {
      return ReactFontManager.getInstance()
          .getTypeface(fontFamilyName, typefaceStyle, assetManager);
    }
  }
}
