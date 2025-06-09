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
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import java.lang.ref.WeakReference

/**
 * Animation responsible for updating opacity of a view. It should ideally use hardware texture to
 * optimize rendering performances.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
internal class OpacityAnimation(view: View, private val startOpacity: Float, endOpacity: Float) :
    Animation() {
  private val viewRef = WeakReference(view)
  private val deltaOpacity = endOpacity - startOpacity

  init {
    setAnimationListener(OpacityAnimationListener(view))
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "OpacityAnimation", LegacyArchitectureLogLevel.ERROR)
  }

  class OpacityAnimationListener(view: View) : Animation.AnimationListener {
    private val viewRef = WeakReference(view)
    private var layerTypeChanged = false

    override fun onAnimationStart(animation: Animation) {
      viewRef.get()?.let { view ->
        if (view.hasOverlappingRendering() && view.layerType == View.LAYER_TYPE_NONE) {
          layerTypeChanged = true
          view.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        }
      }
    }

    override fun onAnimationEnd(animation: Animation) {
      viewRef.get()?.let { view ->
        if (layerTypeChanged) {
          view.setLayerType(View.LAYER_TYPE_NONE, null)
        }
      }
    }

    override fun onAnimationRepeat(animation: Animation) {
      // do nothing
    }
  }

  @VisibleForTesting
  public override fun applyTransformation(interpolatedTime: Float, t: Transformation) {
    viewRef.get()?.let { view -> view.alpha = startOpacity + deltaOpacity * interpolatedTime }
  }

  override fun willChangeBounds(): Boolean {
    return false
  }
}
