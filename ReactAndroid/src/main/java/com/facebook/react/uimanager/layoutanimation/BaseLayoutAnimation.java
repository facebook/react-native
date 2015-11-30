// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager.layoutanimation;

import android.view.View;
import android.view.animation.Animation;
import android.view.animation.ScaleAnimation;

import com.facebook.react.uimanager.IllegalViewOperationException;

/**
 * Class responsible for default layout animation, i.e animation of view creation and deletion.
 */
/* package */ abstract class BaseLayoutAnimation extends AbstractLayoutAnimation {

  abstract boolean isReverse();

  @Override
  boolean isValid() {
    return mDurationMs > 0 && mAnimatedProperty != null;
  }

  @Override
  Animation createAnimationImpl(View view, int x, int y, int width, int height) {
    float fromValue = isReverse() ? 1.0f : 0.0f;
    float toValue = isReverse() ? 0.0f : 1.0f;
    if (mAnimatedProperty != null) {
      switch (mAnimatedProperty) {
        case OPACITY:
          return new OpacityAnimation(view, fromValue, toValue);
        case SCALE_XY:
          return new ScaleAnimation(
              fromValue,
              toValue,
              fromValue,
              toValue,
              Animation.RELATIVE_TO_PARENT,
              .5f,
              Animation.RELATIVE_TO_PARENT,
              .5f);
        default:
          throw new IllegalViewOperationException(
              "Missing animation for property : " + mAnimatedProperty);
      }
    }
    throw new IllegalViewOperationException("Missing animated property from animation config");
  }
}
