package com.facebook.react.views.text;

import android.text.TextPaint;
import android.text.style.CharacterStyle;
import java.lang.reflect.Method;

// @Taskadev1 Color underline highlight span
public class UnderlineStyleSpan extends CharacterStyle implements ReactSpan {
  private final int mColor;

  public UnderlineStyleSpan(final int color) {
      mColor = color;
  }

  @Override
  public void updateDrawState(TextPaint textPaint) {
    try {
      final Method method = TextPaint.class.getMethod("setUnderlineText", Integer.TYPE, Float.TYPE);
      method.invoke(textPaint, mColor, 8.0f);
    } catch (final Exception e) {
      textPaint.setUnderlineText(true);
    }
  }
}
