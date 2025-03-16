/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
 * Class responsible for parsing and converting layout animation data into native [Animation]
 * in order to animate layout when a valid configuration has been supplied by the application.
 */
@LegacyArchitecture
/* package */
internal abstract class AbstractLayoutAnimation {
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
    height: Int
  ): Animation?
    
  @VisibleForTesting var mInterpolator: Interpolator? = null
  @VisibleForTesting var mDelayMs: Int = 0
  @VisibleForTesting var mAnimatedProperty: AnimatedPropertyType? = null
  @VisibleForTesting var mDurationMs: Int = 0

  fun reset() {
    mAnimatedProperty = null
    mDurationMs = 0
    mDelayMs = 0
    mInterpolator = null
  }

  fun initializeFromConfig(data: ReadableMap, globalDuration: Int) {
    mAnimatedProperty =
    if (data.hasKey("property"))
      AnimatedPropertyType.fromString(data.getString("property")!!)
    else null
    mDurationMs = if (data.hasKey("duration")) data.getInt("duration") else globalDuration
    mDelayMs = if (data.hasKey("delay")) data.getInt("delay") else 0
    require(data.hasKey("type")) { "Missing interpolation type." }
    mInterpolator = getInterpolator(
      InterpolatorType.fromString(
        data.getString("type")!!
      ), data
    )

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
    val animation = createAnimationImpl(view, x, y, width, height)
    if (animation != null) {
      val slowdownFactor = if (SLOWDOWN_ANIMATION_MODE) 10 else 1
      animation.duration = (mDurationMs * slowdownFactor).toLong()
      animation.startOffset = (mDelayMs * slowdownFactor).toLong()
      animation.interpolator = mInterpolator
    }
    return animation
  }

  companion object {
    init {
      LegacyArchitectureLogger.assertWhenLegacyArchitectureMinifyingEnabled(
        "AbstractLayoutAnimation", LegacyArchitectureLogLevel.WARNING
      )
    }

    // Forces animation to be playing 10x slower, used for debug purposes.
    private const val SLOWDOWN_ANIMATION_MODE = false

    private val INTERPOLATOR: Map<InterpolatorType, BaseInterpolator> = mapOf(
      InterpolatorType.LINEAR to LinearInterpolator(),
      InterpolatorType.EASE_IN to AccelerateInterpolator(),
      InterpolatorType.EASE_OUT to DecelerateInterpolator(),
      InterpolatorType.EASE_IN_EASE_OUT to AccelerateDecelerateInterpolator()
    )

    @VisibleForTesting
    fun getInterpolator(type: InterpolatorType, params: ReadableMap): Interpolator {
      val interpolator = if (type == InterpolatorType.SPRING) {
        SimpleSpringInterpolator(SimpleSpringInterpolator.getSpringDamping(params))
      } else {
        INTERPOLATOR[type]
      }
      requireNotNull(interpolator) { "Missing interpolator for type : $type" }
      return interpolator
    }
  }
}
