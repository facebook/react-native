/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image

import android.graphics.Matrix
import android.graphics.Rect
import com.facebook.drawee.drawable.ScalingUtils
import com.facebook.drawee.drawable.ScalingUtils.AbstractScaleType
import kotlin.math.min

internal class ScaleTypeStartInside : AbstractScaleType() {
  override fun getTransformImpl(
      outTransform: Matrix,
      parentRect: Rect,
      childWidth: Int,
      childHeight: Int,
      focusX: Float,
      focusY: Float,
      scaleX: Float,
      scaleY: Float
  ) {
    val scale = min(scaleX, scaleY).coerceAtMost(1.0f)
    val dx = parentRect.left.toFloat()
    val dy = parentRect.top.toFloat()
    outTransform.setScale(scale, scale)
    outTransform.postTranslate(Math.round(dx).toFloat(), Math.round(dy).toFloat())
  }

  override fun toString(): String {
    return "start_inside"
  }

  companion object {
    val INSTANCE: ScalingUtils.ScaleType = ScaleTypeStartInside()
  }
}
