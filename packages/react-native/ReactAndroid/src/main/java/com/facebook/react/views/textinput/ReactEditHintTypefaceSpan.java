package com.facebook.react.views.textinput;

import android.graphics.Typeface;
import android.text.TextPaint;
import android.text.style.MetricAffectingSpan;

public class ReactEditHintTypefaceSpan extends MetricAffectingSpan {
    private final Typeface typeface;

    public ReactEditHintTypefaceSpan(Typeface typeface) {
        this.typeface = typeface;
    }

    @Override
    public void updateDrawState(TextPaint paint) {
        paint.setTypeface(typeface);
    }

    @Override
    public void updateMeasureState(TextPaint paint) {
        paint.setTypeface(typeface);
    }
}
