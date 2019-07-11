// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager.layoutanimation;

import android.view.View;
import android.view.animation.Animation;
import android.view.animation.TranslateAnimation;
import androidx.annotation.Nullable;

/**
 * Class responsible for handling layout update animation, applied to view whenever a valid config
 * was supplied for the layout animation of UPDATE type.
 */
/* package */ class LayoutUpdateAnimation extends AbstractLayoutAnimation {

  // We are currently not enabling translation GPU-accelerated animated, as it creates odd
  // artifacts with native react scrollview. This needs to be investigated.
  private static final boolean USE_TRANSLATE_ANIMATION = false;

  @Override
  boolean isValid() {
    return mDurationMs > 0;
  }

  @Override
  @Nullable
  Animation createAnimationImpl(View view, int x, int y, int width, int height) {
    boolean animateLocation = view.getX() != x || view.getY() != y;
    boolean animateSize = view.getWidth() != width || view.getHeight() != height;
    if (!animateLocation && !animateSize) {
      return null;
    } else if (animateLocation && !animateSize && USE_TRANSLATE_ANIMATION) {
      // Use GPU-accelerated animation, however we loose the ability to resume interrupted
      // animation where it was left off. We may be able to listen to animation interruption
      // and set the layout manually in this case, so that next animation kicks off smoothly.
      return new TranslateAnimation(view.getX() - x, 0, view.getY() - y, 0);
    } else {
      // Animation is sub-optimal for perf, but scale transformation can't be use in this case.
      return new PositionAndSizeAnimation(view, x, y, width, height);
    }
  }
}
