/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation;

import android.view.View;
import android.view.animation.Animation;
import android.view.animation.Transformation;
import com.facebook.infer.annotation.Nullsafe;

/**
 * Animation responsible for updating opacity of a view. It should ideally use hardware texture to
 * optimize rendering performances.
 */
/* package */ @Nullsafe(Nullsafe.Mode.LOCAL)
class OpacityAnimation extends Animation {
  private final View mView;
  private final float mStartOpacity, mDeltaOpacity;

  public OpacityAnimation(View view, float startOpacity, float endOpacity) {
    mView = view;
    mStartOpacity = startOpacity;
    mDeltaOpacity = endOpacity - startOpacity;

    setAnimationListener(new OpacityAnimationListener(view));
  }

  @Override
  protected void applyTransformation(float interpolatedTime, Transformation t) {
    mView.setAlpha(mStartOpacity + mDeltaOpacity * interpolatedTime);
  }

  @Override
  public boolean willChangeBounds() {
    return false;
  }
}
