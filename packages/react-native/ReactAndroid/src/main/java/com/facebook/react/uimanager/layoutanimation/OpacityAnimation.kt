/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

import android.view.View
import android.view.animation.Animation
import android.view.animation.Transformation
import com.facebook.react.common.annotations.VisibleForTesting

/**
 * Animation responsible for updating opacity of a view. It should ideally use hardware texture to
 * optimize rendering performances.
 */
internal class OpacityAnimation(
    private val view: View,
    private val startOpacity: Float,
    endOpacity: Float
) : Animation() {
  private val deltaOpacity = endOpacity - startOpacity

  init {
    setAnimationListener(OpacityAnimationListener(view))
  }

  @VisibleForTesting
  public override fun applyTransformation(interpolatedTime: Float, t: Transformation) {
    view.alpha = startOpacity + deltaOpacity * interpolatedTime
  }

  override fun willChangeBounds(): Boolean {
    return false
  }
}
