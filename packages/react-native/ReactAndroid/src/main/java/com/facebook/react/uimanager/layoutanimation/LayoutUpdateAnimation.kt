/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

import android.view.View
import android.view.animation.Animation
import android.view.animation.TranslateAnimation

/**
 * Class responsible for handling layout update animation, applied to view whenever a valid config
 * was supplied for the layout animation of UPDATE type.
 */
internal class LayoutUpdateAnimation : AbstractLayoutAnimation() {

  internal override fun isValid(): Boolean = mDurationMs > 0

  internal override fun createAnimationImpl(
      view: View,
      x: Int,
      y: Int,
      width: Int,
      height: Int
  ): Animation? {
    val animateLocation = view.x.toInt() != x || view.y.toInt() != y
    val animateSize = view.width != width || view.height != height
    if (!animateLocation && !animateSize) {
      return null
    } else if (animateLocation && !animateSize && USE_TRANSLATE_ANIMATION) {
      // Use GPU-accelerated animation, however we loose the ability to resume interrupted
      // animation where it was left off. We may be able to listen to animation interruption
      // and set the layout manually in this case, so that next animation kicks off smoothly.
      return TranslateAnimation(view.x - x, 0f, view.y - y, 0f)
    } else {
      // Animation is sub-optimal for perf, but scale transformation can't be use in this case.
      return PositionAndSizeAnimation(view, x, y, width, height)
    }
  }

  private companion object {
    // We are currently not enabling translation GPU-accelerated animated, as it creates odd
    // artifacts with native react scrollview. This needs to be investigated.
    private const val USE_TRANSLATE_ANIMATION = false
  }
}
