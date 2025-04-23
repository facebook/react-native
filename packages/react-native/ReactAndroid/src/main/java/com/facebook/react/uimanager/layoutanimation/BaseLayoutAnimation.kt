/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

import android.view.View
import android.view.animation.Animation
import android.view.animation.ScaleAnimation
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.uimanager.IllegalViewOperationException

/** Class responsible for default layout animation, i.e animation of view creation and deletion. */
@LegacyArchitecture
internal abstract class BaseLayoutAnimation : AbstractLayoutAnimation() {
  abstract fun isReverse(): Boolean

  override fun isValid(): Boolean = durationMs > 0 && animatedProperty != null

  override fun createAnimationImpl(view: View, x: Int, y: Int, width: Int, height: Int): Animation {
    animatedProperty?.let {
      return when (it) {
        AnimatedPropertyType.OPACITY -> {
          val fromValue = if (isReverse()) view.alpha else 0.0f
          val toValue = if (isReverse()) 0.0f else view.alpha
          OpacityAnimation(view, fromValue, toValue)
        }

        AnimatedPropertyType.SCALE_XY -> {
          val fromValue = if (isReverse()) 1.0f else 0.0f
          val toValue = if (isReverse()) 0.0f else 1.0f
          ScaleAnimation(
              fromValue,
              toValue,
              fromValue,
              toValue,
              Animation.RELATIVE_TO_SELF,
              .5f,
              Animation.RELATIVE_TO_SELF,
              .5f)
        }

        AnimatedPropertyType.SCALE_X -> {
          val fromValue = if (isReverse()) 1.0f else 0.0f
          val toValue = if (isReverse()) 0.0f else 1.0f
          ScaleAnimation(
              fromValue,
              toValue,
              1f,
              1f,
              Animation.RELATIVE_TO_SELF,
              .5f,
              Animation.RELATIVE_TO_SELF,
              0f)
        }

        AnimatedPropertyType.SCALE_Y -> {
          val fromValue = if (isReverse()) 1.0f else 0.0f
          val toValue = if (isReverse()) 0.0f else 1.0f
          ScaleAnimation(
              1f,
              1f,
              fromValue,
              toValue,
              Animation.RELATIVE_TO_SELF,
              0f,
              Animation.RELATIVE_TO_SELF,
              .5f)
        }
      }
    } ?: throw IllegalViewOperationException("Missing animated property from animation config")
  }

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "BaseLayoutAnimation", LegacyArchitectureLogLevel.WARNING)
    }
  }
}
