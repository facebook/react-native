package com.facebook.react.views.text;

import android.graphics.Typeface;

public interface TypefaceProvider {
    Typeface getOrCreateTypeface(String family, int style);
}
