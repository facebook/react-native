/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager.layoutanimation

import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.AccelerateInterpolator
import android.view.animation.Animation
import android.view.animation.BaseInterpolator
import android.view.animation.DecelerateInterpolator
import android.view.animation.Interpolator
import android.view.animation.LinearInterpolator
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.uimanager.IllegalViewOperationException

/**
 * Class responsible for parsing and converting layout animation data into native [Animation] in
 * order to animate layout when a valid configuration has been supplied by the application.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
internal abstract class AbstractLayoutAnimation {
  var interpolator: Interpolator? = null
  var delayMs: Int = 0
  var animatedProperty: AnimatedPropertyType? = null
  var durationMs: Int = 0

  internal abstract fun isValid(): Boolean

  /**
   * Create an animation object for the current animation type, based on the view and final screen
   * coordinates. If the application-supplied configuration does not specify an animation definition
   * for this types, or if the animation definition is invalid, returns null.
   */
  internal abstract fun createAnimationImpl(
      view: View,
      x: Int,
      y: Int,
      width: Int,
      height: Int,
  ): Animation?

  fun reset() {
    animatedProperty = null
    durationMs = 0
    delayMs = 0
    interpolator = null
  }

  fun initializeFromConfig(data: ReadableMap, globalDuration: Int) {
    animatedProperty =
        if (data.hasKey("property")) {
          AnimatedPropertyType.fromString(data.getString("property").orEmpty())
        } else {
          null
        }
    durationMs = if (data.hasKey("duration")) data.getInt("duration") else globalDuration
    delayMs = if (data.hasKey("delay")) data.getInt("delay") else 0
    require(data.hasKey("type")) { "Missing interpolation type." }

    interpolator =
        getInterpolator(InterpolatorType.fromString(data.getString("type").orEmpty()), data)

    if (!isValid()) {
      throw IllegalViewOperationException("Invalid layout animation : $data")
    }
  }

  /**
   * Create an animation object to be used to animate the view, based on the animation config
   * supplied at initialization time and the new view position and size.
   *
   * @param view the view to create the animation for
   * @param x the new X position for the view
   * @param y the new Y position for the view
   * @param width the new width value for the view
   * @param height the new height value for the view
   */
  fun createAnimation(view: View, x: Int, y: Int, width: Int, height: Int): Animation? {
    if (!isValid()) {
      return null
    }

    return createAnimationImpl(view, x, y, width, height)?.apply {
      val slowdownFactor = if (SLOWDOWN_ANIMATION_MODE) 10 else 1
      duration = (durationMs * slowdownFactor).toLong()
      startOffset = (delayMs * slowdownFactor).toLong()
      interpolator = this@AbstractLayoutAnimation.interpolator
    }
  }

  companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "AbstractLayoutAnimation",
          LegacyArchitectureLogLevel.ERROR,
      )
    }

    // Forces animation to be playing 10x slower, used for debug purposes.
    private const val SLOWDOWN_ANIMATION_MODE = false

    private val INTERPOLATOR: Map<InterpolatorType, BaseInterpolator> =
        mapOf(
            InterpolatorType.LINEAR to LinearInterpolator(),
            InterpolatorType.EASE_IN to AccelerateInterpolator(),
            InterpolatorType.EASE_OUT to DecelerateInterpolator(),
            InterpolatorType.EASE_IN_EASE_OUT to AccelerateDecelerateInterpolator(),
        )

    @VisibleForTesting
    fun getInterpolator(type: InterpolatorType, params: ReadableMap): Interpolator {
      val interpolator =
          if (type == InterpolatorType.SPRING) {
            SimpleSpringInterpolator(SimpleSpringInterpolator.getSpringDamping(params))
          } else {
            INTERPOLATOR[type]
          }
      requireNotNull(interpolator) { "Missing interpolator for type : $type" }
      return interpolator
    }
  }
}
