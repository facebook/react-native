/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span;

import android.graphics.Color;
import android.graphics.ColorSpace;
import android.text.TextPaint;
import android.text.style.CharacterStyle;
import com.facebook.infer.annotation.Nullsafe;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class ShadowStyleSpan extends CharacterStyle implements ReactSpan {
  private final float mDx, mDy, mRadius;
  private final long mColor;

  public ShadowStyleSpan(float dx, float dy, float radius, int color) {
    mDx = dx;
    mDy = dy;
    mRadius = radius;
    mColor = Color.pack(color);
  }

  public ShadowStyleSpan(float dx, float dy, float radius, long color) {
    mDx = dx;
    mDy = dy;
    mRadius = radius;
    mColor = color;
  }

  @Override
  public void updateDrawState(TextPaint textPaint) {
    textPaint.setShadowLayer(mRadius, mDx, mDy, mColor);
  }
}
