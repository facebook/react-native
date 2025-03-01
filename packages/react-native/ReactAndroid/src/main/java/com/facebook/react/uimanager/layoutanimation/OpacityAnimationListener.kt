/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

import android.view.View
import android.view.animation.Animation

internal class OpacityAnimationListener(private val view: View) : Animation.AnimationListener {
  private var layerTypeChanged = false

  override fun onAnimationStart(animation: Animation) {
    if (view.hasOverlappingRendering() && view.layerType == View.LAYER_TYPE_NONE) {
      layerTypeChanged = true
      view.setLayerType(View.LAYER_TYPE_HARDWARE, null)
    }
  }

  override fun onAnimationEnd(animation: Animation) {
    if (layerTypeChanged) {
      view.setLayerType(View.LAYER_TYPE_NONE, null)
    }
  }

  override fun onAnimationRepeat(animation: Animation) {
    // do nothing
  }
}
