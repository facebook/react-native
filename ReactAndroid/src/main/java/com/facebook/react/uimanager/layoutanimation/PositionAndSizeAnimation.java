// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
/* package */ class PositionAndSizeAnimation extends Animation implements LayoutHandlingAnimation {

  private final View mView;
  private float mStartX, mStartY, mDeltaX, mDeltaY;
  private int mStartWidth, mStartHeight, mDeltaWidth, mDeltaHeight;

  public PositionAndSizeAnimation(View view, int x, int y, int width, int height) {
    mView = view;
    calculateAnimation(x, y, width, height);
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
  public void onLayoutUpdate(int x, int y, int width, int height) {
    // Layout changed during the animation, we should update our values so that the final layout
    // is correct.
    calculateAnimation(x, y, width, height);
  }

  @Override
  public boolean willChangeBounds() {
    return true;
  }

  private void calculateAnimation(int x, int y, int width, int height) {
    mStartX = mView.getX() - mView.getTranslationX();
    mStartY = mView.getY() - mView.getTranslationY();
    mStartWidth = mView.getWidth();
    mStartHeight = mView.getHeight();

    mDeltaX = x - mStartX;
    mDeltaY = y - mStartY;
    mDeltaWidth = width - mStartWidth;
    mDeltaHeight = height - mStartHeight;
  }
}
