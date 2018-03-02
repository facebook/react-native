/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import android.text.TextPaint;
import android.text.style.CharacterStyle;

/* package */ final class ShadowStyleSpan extends CharacterStyle {

  /* package */ static final ShadowStyleSpan INSTANCE = new ShadowStyleSpan(0, 0, 0, 0, true);

  private float mDx;
  private float mDy;
  private float mRadius;
  private int mColor;
  private boolean mFrozen;

  private ShadowStyleSpan(float dx, float dy, float radius, int color, boolean frozen) {
    mDx = dx;
    mDy = dy;
    mRadius = radius;
    mColor = color;
    mFrozen = frozen;
  }

  public boolean offsetMatches(float dx, float dy) {
    return mDx == dx && mDy == dy;
  }

  public void setOffset(float dx, float dy) {
    mDx = dx;
    mDy = dy;
  }

  public float getRadius() {
    return mRadius;
  }

  public void setRadius(float radius) {
    mRadius = radius;
  }

  public int getColor() {
    return mColor;
  }

  public void setColor(int color) {
    mColor = color;
  }

  /* package */ ShadowStyleSpan mutableCopy() {
    return new ShadowStyleSpan(mDx, mDy, mRadius, mColor, false);
  }

  /* package */ boolean isFrozen() {
    return mFrozen;
  }

  /* package */ void freeze() {
    mFrozen = true;
  }

  @Override
  public void updateDrawState(TextPaint textPaint) {
    textPaint.setShadowLayer(mRadius, mDx, mDy, mColor);
  }
}
