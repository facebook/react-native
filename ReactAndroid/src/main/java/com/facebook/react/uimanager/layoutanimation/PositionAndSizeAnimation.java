// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager.layoutanimation;

import android.view.View;
import android.view.animation.Animation;
import android.view.animation.Transformation;

/**
 * Animation responsible for updating size and position of a view. We can't use scaling as view
 * content may not necessarily stretch. As a result, this approach is inefficient because of
 * layout passes occurring on every frame.
 * What we might want to try to do instead is use a combined ScaleAnimation and TranslateAnimation.
 */
/* package */ class PositionAndSizeAnimation extends Animation implements HandleLayout {

  private final View mView;
  private final float mStartX, mStartY, mDeltaX, mDeltaY;
  private final int mStartWidth, mStartHeight, mDeltaWidth, mDeltaHeight;

  public PositionAndSizeAnimation(View view, int x, int y, int width, int height) {
    mView = view;

    mStartX = view.getX() - view.getTranslationX();
    mStartY = view.getY() - view.getTranslationY();
    mStartWidth = view.getWidth();
    mStartHeight = view.getHeight();

    mDeltaX = x - mStartX;
    mDeltaY = y - mStartY;
    mDeltaWidth = width - mStartWidth;
    mDeltaHeight = height - mStartHeight;
  }

  @Override
  protected void applyTransformation(float interpolatedTime, Transformation t) {
    float newX = mStartX + mDeltaX * interpolatedTime;
    float newY = mStartY + mDeltaY * interpolatedTime;
    float newWidth = mStartWidth + mDeltaWidth * interpolatedTime;
    float newHeight = mStartHeight + mDeltaHeight * interpolatedTime;
    mView.layout(
        Math.round(newX),
        Math.round(newY),
        Math.round(newX + newWidth),
        Math.round(newY + newHeight));
  }

  @Override
  public boolean willChangeBounds() {
    return true;
  }
}
