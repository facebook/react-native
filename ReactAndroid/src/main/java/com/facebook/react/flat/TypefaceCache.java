/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import java.util.HashMap;

import android.content.res.AssetManager;
import android.graphics.Typeface;

import com.facebook.infer.annotation.Assertions;

/**
 * TypefaceCache provides methods to resolve typeface from font family, or existing typeface
 * with a different style.
 */
/* package */ final class TypefaceCache {

  private static final int MAX_STYLES = 4; // NORMAL = 0, BOLD = 1, ITALIC = 2, BOLD_ITALIC = 3

  private static final HashMap<String, Typeface[]> FONTFAMILY_CACHE = new HashMap<>();
  private static final HashMap<Typeface, Typeface[]> TYPEFACE_CACHE = new HashMap<>();

  private static final String[] EXTENSIONS = {
      "",
      "_bold",
      "_italic",
      "_bold_italic"};
  private static final String[] FILE_EXTENSIONS = {".ttf", ".otf"};
  private static final String FONTS_ASSET_PATH = "fonts/";

  @Nullable private static AssetManager sAssetManager = null;

  public static void setAssetManager(AssetManager assetManager) {
    sAssetManager = assetManager;
  }

  /**
   * Returns a Typeface for a given a FontFamily and style.
   */
  public static Typeface getTypeface(String fontFamily, int style) {
    Typeface[] cache = FONTFAMILY_CACHE.get(fontFamily);
    if (cache == null) {
      // cache is empty, create one.
      cache = new Typeface[MAX_STYLES];
      FONTFAMILY_CACHE.put(fontFamily, cache);
    } else if (cache[style] != null) {
      // return cached value.
      return cache[style];
    }

    Typeface typeface = createTypeface(fontFamily, style);
    cache[style] = typeface;
    TYPEFACE_CACHE.put(typeface, cache);
    return typeface;
  }

  private static Typeface createTypeface(String fontFamilyName, int style) {
    String extension = EXTENSIONS[style];
    StringBuilder fileNameBuffer = new StringBuilder(32)
        .append(FONTS_ASSET_PATH)
        .append(fontFamilyName)
        .append(extension);
    int length = fileNameBuffer.length();
    for (String fileExtension : FILE_EXTENSIONS) {
      String fileName = fileNameBuffer.append(fileExtension).toString();
      try {
        return Typeface.createFromAsset(sAssetManager, fileName);
      } catch (RuntimeException e) {
        // unfortunately Typeface.createFromAsset throws an exception instead of returning null
        // if the typeface doesn't exist
        fileNameBuffer.setLength(length);
      }
    }
    return Assertions.assumeNotNull(Typeface.create(fontFamilyName, style));
  }

  /**
   * Returns a derivative of a given Typeface with a different style.
   */
  public static Typeface getTypeface(Typeface typeface, int style) {
    if (typeface == null) {
      return Typeface.defaultFromStyle(style);
    }

    Typeface[] cache = TYPEFACE_CACHE.get(typeface);
    if (cache == null) {
      // This should not happen because all Typefaces are coming from TypefaceCache,
      // and thus should be registered in TYPEFACE_CACHE.
      // If we get here, it's a bug and one of the 2 scenarios happened:
      // a) TypefaceCache created a Typeface and didn't put it into TYPEFACE_CACHE.
      // b) someone else created a Typeface bypassing TypefaceCache so it's not registered here.
      //
      // If it's not registered, we can just register it manually for consistency, and so that
      // next time someone requests a un unknown Typeface, it's already cached and we don't create
      // extra copies.
      cache = new Typeface[MAX_STYLES];
      cache[typeface.getStyle()] = typeface;
    } else if (cache[style] != null) {
      // return cached value.
      return cache[style];
    }

    typeface = Typeface.create(typeface, style);
    cache[style] = typeface;
    TYPEFACE_CACHE.put(typeface, cache);
    return typeface;
  }
}
