/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager.layoutanimation

import android.view.animation.Interpolator
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import kotlin.math.pow
import kotlin.math.sin

/** Simple spring interpolator */
// TODO(7613736): Improve spring interpolator with friction and damping variable support
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
internal class SimpleSpringInterpolator @JvmOverloads constructor(springDamping: Float = FACTOR) :
    Interpolator {
  private val _springDamping: Float = springDamping

  override fun getInterpolation(input: Float): Float =
      // Using mSpringDamping in this equation is not really the exact mathematical springDamping,
      // but a good approximation
      // We need to replace this equation with the right Factor that accounts for damping and
      // friction
      (1 +
              2.0.pow((-10 * input).toDouble()) *
                  sin((input - _springDamping / 4) * Math.PI * 2 / _springDamping))
          .toFloat()

  companion object {

    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "SimpleSpringInterpolator",
          LegacyArchitectureLogLevel.ERROR,
      )
    }

    private const val FACTOR = 0.5f
    const val PARAM_SPRING_DAMPING: String = "springDamping"

    @JvmStatic
    fun getSpringDamping(params: ReadableMap): Float =
        if (params.getType(PARAM_SPRING_DAMPING) == ReadableType.Number) {
          params.getDouble(PARAM_SPRING_DAMPING).toFloat()
        } else {
          FACTOR
        }
  }
}
