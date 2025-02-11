/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import kotlin.math.abs
import kotlin.math.pow

/**
 * Manipulates a corner radius of the shadow-shape according to the radius of the original
 * background, and the applied spread (negative, if inset). See algorithm at
 * https://drafts.csswg.org/css-backgrounds/#shadow-shape
 */
internal fun adjustRadiusForSpread(
    radius: Float,
    spread: Float,
): Float {
  val spreadMultiplier =
      if (radius < abs(spread)) {
        1 + (radius / abs(spread) - 1).pow(3)
      } else {
        1f
      }
  return (radius + spread * spreadMultiplier).coerceAtLeast(0f)
}
