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
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger

/**
 * Animation responsible for updating size and position of a view. We can't use scaling as view
 * content may not necessarily stretch. As a result, this approach is inefficient because of layout
 * passes occurring on every frame. What we might want to try to do instead is use a combined
 * ScaleAnimation and TranslateAnimation.
 */
@LegacyArchitecture
internal class PositionAndSizeAnimation(
    private val view: View,
    x: Int,
    y: Int,
    width: Int,
    height: Int
) : Animation(), LayoutHandlingAnimation {
  private var startX = 0f
  private var startY = 0f
  private var deltaX = 0f
  private var deltaY = 0f
  private var startWidth = 0
  private var startHeight = 0
  private var deltaWidth = 0
  private var deltaHeight = 0

  init {
    calculateAnimation(x, y, width, height)
    LegacyArchitectureLogger.assertWhenLegacyArchitectureMinifyingEnabled(
        "PositionAndSizeAnimation")
  }

  override fun applyTransformation(interpolatedTime: Float, t: Transformation) {
    val newX = startX + deltaX * interpolatedTime
    val newY = startY + deltaY * interpolatedTime
    val newWidth = startWidth + deltaWidth * interpolatedTime
    val newHeight = startHeight + deltaHeight * interpolatedTime
    view.layout(
        Math.round(newX),
        Math.round(newY),
        Math.round(newX + newWidth),
        Math.round(newY + newHeight))
  }

  override fun onLayoutUpdate(x: Int, y: Int, width: Int, height: Int) {
    // Layout changed during the animation, we should update our values so that the final layout
    // is correct.
    calculateAnimation(x, y, width, height)
  }

  override fun willChangeBounds(): Boolean {
    return true
  }

  private fun calculateAnimation(x: Int, y: Int, width: Int, height: Int) {
    startX = view.x - view.translationX
    startY = view.y - view.translationY
    startWidth = view.width
    startHeight = view.height

    deltaX = x - startX
    deltaY = y - startY
    deltaWidth = width - startWidth
    deltaHeight = height - startHeight
  }
}
