/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

import android.view.animation.Interpolator
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger

/** Simple spring interpolator */
// TODO(7613736): Improve spring interpolator with friction and damping variable support
@LegacyArchitecture
internal class SimpleSpringInterpolator : Interpolator {
  private val _springDamping: Float

  @JvmOverloads
  constructor(springDamping: Float = FACTOR) {
    _springDamping = springDamping
  }

  override fun getInterpolation(input: Float): Float =
      // Using mSpringDamping in this equation is not really the exact mathematical springDamping,
      // but a good approximation
      // We need to replace this equation with the right Factor that accounts for damping and
      // friction
      (1 +
              Math.pow(2.0, (-10 * input).toDouble()) *
                  Math.sin((input - _springDamping / 4) * Math.PI * 2 / _springDamping))
          .toFloat()

  companion object {

    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "SimpleSpringInterpolator", LegacyArchitectureLogLevel.WARNING)
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
