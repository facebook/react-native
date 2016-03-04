/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;


import android.text.TextPaint;
import android.text.style.CharacterStyle;

public class ShadowStyleSpan extends CharacterStyle {
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
}
