/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation;

import android.view.View;
import android.view.animation.Animation;
import android.view.animation.ScaleAnimation;
import com.facebook.react.uimanager.IllegalViewOperationException;

/** Class responsible for default layout animation, i.e animation of view creation and deletion. */
/* package */ abstract class BaseLayoutAnimation extends AbstractLayoutAnimation {

  abstract boolean isReverse();

  @Override
  boolean isValid() {
    return mDurationMs > 0 && mAnimatedProperty != null;
  }

  @Override
  Animation createAnimationImpl(View view, int x, int y, int width, int height) {
    if (mAnimatedProperty != null) {
      switch (mAnimatedProperty) {
        case OPACITY:
          {
            float fromValue = isReverse() ? view.getAlpha() : 0.0f;
            float toValue = isReverse() ? 0.0f : view.getAlpha();
            return new OpacityAnimation(view, fromValue, toValue);
          }
        case SCALE_XY:
          {
            float fromValue = isReverse() ? 1.0f : 0.0f;
            float toValue = isReverse() ? 0.0f : 1.0f;
            return new ScaleAnimation(
                fromValue,
                toValue,
                fromValue,
                toValue,
                Animation.RELATIVE_TO_SELF,
                .5f,
                Animation.RELATIVE_TO_SELF,
                .5f);
          }
        case SCALE_X:
          {
            float fromValue = isReverse() ? 1.0f : 0.0f;
            float toValue = isReverse() ? 0.0f : 1.0f;
            return new ScaleAnimation(
                fromValue,
                toValue,
                1f,
                1f,
                Animation.RELATIVE_TO_SELF,
                .5f,
                Animation.RELATIVE_TO_SELF,
                0f);
          }
        case SCALE_Y:
          {
            float fromValue = isReverse() ? 1.0f : 0.0f;
            float toValue = isReverse() ? 0.0f : 1.0f;
            return new ScaleAnimation(
                1f,
                1f,
                fromValue,
                toValue,
                Animation.RELATIVE_TO_SELF,
                0f,
                Animation.RELATIVE_TO_SELF,
                .5f);
          }
        default:
          throw new IllegalViewOperationException(
              "Missing animation for property : " + mAnimatedProperty);
      }
    }
    throw new IllegalViewOperationException("Missing animated property from animation config");
  }
}
