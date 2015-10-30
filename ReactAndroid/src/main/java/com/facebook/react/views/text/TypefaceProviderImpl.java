package com.facebook.react.views.text;

import android.graphics.Typeface;

import java.util.HashMap;
import java.util.Map;

public class TypefaceProviderImpl implements TypefaceProvider {
  // Typeface caching is a bit weird: once a Typeface is created, it cannot be changed, so we need
  // to cache each font family and each style that they have. Typeface does cache this already in
  // Typeface.create(Typeface, style) post API 16, but for that you already need a Typeface.
  // Therefore, here we cache one style for each font family, and let Typeface cache all styles for
  // that font family. Of course this is not ideal, and especially after adding Typeface loading
  // from assets, we will need to have our own caching mechanism for all Typeface creation types.
  // TODO: t6866343 add better Typeface caching
  private static final Map<String, Typeface> sTypefaceCache = new HashMap<String, Typeface>();

  private final Map<String, Typeface> typefaceCache = new HashMap<String, Typeface>();

  @Override
  public Typeface getOrCreateTypeface(String family, int style) {
    // Locally defined fonts are preferred over the system fonts, allowing for application-wide
    // font replacement.
    if (typefaceCache.get(family) != null) {
      return typefaceCache.get(family);
    }
    if (sTypefaceCache.get(family) != null) {
      return sTypefaceCache.get(family);
    }

    Typeface typeface = Typeface.create(family, style);
    sTypefaceCache.put(family, typeface);
    return typeface;
  }

  public void addTypeFace(String name, Typeface typeface) {
    typefaceCache.put(name, typeface);
  }
}
