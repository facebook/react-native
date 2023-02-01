/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.ParcelableSpan;
import android.text.TextPaint;
import android.text.style.CharacterStyle;
import android.text.style.UpdateAppearance;
import androidx.annotation.Nullable;

public class ShadowStyleSpan extends CharacterStyle implements ReactSpan, UpdateAppearance {
  private final float mDx, mDy, mRadius;
  private final int mColor;

  public ShadowStyleSpan(float dx, float dy, float radius, int color) {
    mDx = dx;
    mDy = dy;
    mRadius = radius;
    mColor = color;
  }

  @Override
  public void updateDrawState(TextPaint textPaint) {
    textPaint.setShadowLayer(mRadius, mDx, mDy, mColor);
  }

  @Nullable
  @Override
  public ParcelableSpan asParcelable() {
    return null;
  }
}
