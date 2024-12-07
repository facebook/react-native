/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.content.Context;
import android.content.res.AssetManager;
import android.graphics.Typeface;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;

/**
 * Responsible for loading and caching Typeface objects.
 *
 * @deprecated This class is deprecated and it will be deleted in the near future. Please use {@link
 *     com.facebook.react.common.assets.ReactFontManager} instead.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
@Deprecated
public class ReactFontManager {

  private static ReactFontManager sReactFontManagerInstance;
  private final com.facebook.react.common.assets.ReactFontManager mDelegate;

  private ReactFontManager(com.facebook.react.common.assets.ReactFontManager delegate) {
    mDelegate = delegate;
  }

  public static ReactFontManager getInstance() {
    if (sReactFontManagerInstance == null) {
      sReactFontManagerInstance =
          new ReactFontManager(com.facebook.react.common.assets.ReactFontManager.getInstance());
    }
    return sReactFontManagerInstance;
  }

  public Typeface getTypeface(String fontFamilyName, int style, AssetManager assetManager) {
    return mDelegate.getTypeface(fontFamilyName, style, assetManager);
  }

  public Typeface getTypeface(
      String fontFamilyName, int weight, boolean italic, AssetManager assetManager) {
    return mDelegate.getTypeface(fontFamilyName, weight, italic, assetManager);
  }

  public Typeface getTypeface(
      String fontFamilyName, int style, int weight, AssetManager assetManager) {
    return mDelegate.getTypeface(fontFamilyName, style, weight, assetManager);
  }

  public void addCustomFont(Context context, String fontFamily, int fontId) {
    mDelegate.addCustomFont(context, fontFamily, fontId);
  }

  public void addCustomFont(String fontFamily, @Nullable Typeface font) {
    mDelegate.addCustomFont(fontFamily, font);
  }

  public void setTypeface(String fontFamilyName, int style, Typeface typeface) {
    mDelegate.setTypeface(fontFamilyName, style, typeface);
  }
}
