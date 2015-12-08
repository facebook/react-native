/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import java.util.HashMap;

import android.graphics.Typeface;

/**
 * TypefaceCache provides methods to resolve typeface from font family, or existing typeface
 * with a different style.
 */
/* package */ final class TypefaceCache {

  private static final int MAX_STYLES = 4; // NORMAL = 0, BOLD = 1, ITALIC = 2, BOLD_ITALIC = 3

  private static final HashMap<String, Typeface[]> FONTFAMILY_CACHE = new HashMap<>();
  private static final HashMap<Typeface, Typeface[]> TYPEFACE_CACHE = new HashMap<>();

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

    Typeface typeface = Typeface.create(fontFamily, style);
    cache[style] = typeface;
    TYPEFACE_CACHE.put(typeface, cache);
    return typeface;
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
