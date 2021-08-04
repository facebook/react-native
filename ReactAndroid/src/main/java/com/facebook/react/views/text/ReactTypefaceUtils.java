/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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
    return ReactBaseTextShadowNode.UNSET;
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
    return ReactBaseTextShadowNode.UNSET;
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
    TypefaceStyle typefaceStyle = new TypefaceStyle(style, weight);
    if (fontFamilyName == null) {
      return typefaceStyle.apply(typeface == null ? Typeface.DEFAULT : typeface);
    } else {
      return ReactFontManager.getInstance()
          .getTypeface(fontFamilyName, typefaceStyle, assetManager);
    }
  }
}
