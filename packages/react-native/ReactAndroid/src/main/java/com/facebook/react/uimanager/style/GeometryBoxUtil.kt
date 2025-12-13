/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.graphics.RectF
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.MarginLayoutParams
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.style.ComputedBorderRadius
import com.facebook.react.uimanager.style.CornerRadii
import com.facebook.react.uimanager.style.GeometryBox
import kotlin.math.max
import kotlin.math.roundToInt

internal object GeometryBoxUtil {

  @JvmStatic
  fun adjustBorderRadiusForGeometryBox(
      geometryBox: GeometryBox?,
      borderRadius: ComputedBorderRadius?,
      computedBorderInsets: RectF?,
      view: View
  ): ComputedBorderRadius? {
    if (borderRadius == null) {
      return null
    }

    val params = view.layoutParams as? MarginLayoutParams

    return when (geometryBox) {
      GeometryBox.MarginBox -> {
        // margin-box: extend border-radius by margin amount
        val marginLeft = params?.leftMargin?.toFloat() ?: 0f
        val marginTop = params?.topMargin?.toFloat() ?: 0f
        val marginRight = params?.rightMargin?.toFloat() ?: 0f
        val marginBottom = params?.bottomMargin?.toFloat() ?: 0f

        ComputedBorderRadius(
            topLeft = CornerRadii(
                horizontal = borderRadius.topLeft.horizontal + marginLeft,
                vertical = borderRadius.topLeft.vertical + marginTop
            ),
            topRight = CornerRadii(
                horizontal = borderRadius.topRight.horizontal + marginRight,
                vertical = borderRadius.topRight.vertical + marginTop
            ),
            bottomLeft = CornerRadii(
                horizontal = borderRadius.bottomLeft.horizontal + marginLeft,
                vertical = borderRadius.bottomLeft.vertical + marginBottom
            ),
            bottomRight = CornerRadii(
                horizontal = borderRadius.bottomRight.horizontal + marginRight,
                vertical = borderRadius.bottomRight.vertical + marginBottom
            )
        )
      }

      GeometryBox.BorderBox, null -> {
        // border-box: use border-radius as-is (this is the reference)
        ComputedBorderRadius(
            topLeft = borderRadius.topLeft.toPixelFromDIP(),
            topRight = borderRadius.topRight.toPixelFromDIP(),
            bottomLeft = borderRadius.bottomLeft.toPixelFromDIP(),
            bottomRight = borderRadius.bottomRight.toPixelFromDIP()
        )
      }

      GeometryBox.PaddingBox -> {
        // padding-box: reduce border-radius by border width
        val borderLeft = computedBorderInsets?.left ?: 0f
        val borderTop = computedBorderInsets?.top ?: 0f
        val borderRight = computedBorderInsets?.right ?: 0f
        val borderBottom = computedBorderInsets?.bottom ?: 0f

        ComputedBorderRadius(
            topLeft = CornerRadii(
                horizontal = max(0f, borderRadius.topLeft.horizontal - borderLeft).dpToPx(),
                vertical = max(0f, borderRadius.topLeft.vertical - borderTop).dpToPx()
            ),
            topRight = CornerRadii(
                horizontal = max(0f, borderRadius.topRight.horizontal - borderRight).dpToPx(),
                vertical = max(0f, borderRadius.topRight.vertical - borderTop).dpToPx()
            ),
            bottomLeft = CornerRadii(
                horizontal = max(0f, borderRadius.bottomLeft.horizontal - borderLeft).dpToPx(),
                vertical = max(0f, borderRadius.bottomLeft.vertical - borderBottom).dpToPx()
            ),
            bottomRight = CornerRadii(
                horizontal = max(0f, borderRadius.bottomRight.horizontal - borderRight).dpToPx(),
                vertical = max(0f, borderRadius.bottomRight.vertical - borderBottom).dpToPx()
            )
        )
      }

      GeometryBox.ContentBox -> {
        // content-box: reduce border-radius by border width + padding
        // padding already includes border width
        val paddingLeft = PixelUtil.toDIPFromPixel(view.paddingLeft.toFloat()).roundToInt()
        val paddingTop = PixelUtil.toDIPFromPixel(view.paddingTop.toFloat()).roundToInt()
        val paddingRight = PixelUtil.toDIPFromPixel(view.paddingRight.toFloat()).roundToInt()
        val paddingBottom = PixelUtil.toDIPFromPixel(view.paddingBottom.toFloat()).roundToInt()

        ComputedBorderRadius(
            topLeft = CornerRadii(
                horizontal = max(0f, borderRadius.topLeft.horizontal - paddingLeft).dpToPx(),
                vertical = max(0f, borderRadius.topLeft.vertical - paddingTop).dpToPx()
            ),
            topRight = CornerRadii(
                horizontal = max(0f, borderRadius.topRight.horizontal - paddingRight).dpToPx(),
                vertical = max(0f, borderRadius.topRight.vertical - paddingTop).dpToPx()
            ),
            bottomLeft = CornerRadii(
                horizontal = max(0f, borderRadius.bottomLeft.horizontal - paddingLeft).dpToPx(),
                vertical = max(0f, borderRadius.bottomLeft.vertical - paddingBottom).dpToPx()
            ),
            bottomRight = CornerRadii(
                horizontal = max(0f, borderRadius.bottomRight.horizontal - paddingRight).dpToPx(),
                vertical = max(0f, borderRadius.bottomRight.vertical - paddingBottom).dpToPx()
            )
        )
      }

      else -> borderRadius // StrokeBox, ViewBox, FillBox - use border-box as fallback
    }
  }

  @JvmStatic
  fun getGeometryBoxBounds(view: View, geometryBox: GeometryBox?, computedBorderInsets: RectF?): RectF {
    val bounds = RectF(0f, 0f, view.width.toFloat(), view.height.toFloat())
    val params = view.layoutParams as? MarginLayoutParams
    val box = when (geometryBox) {
          GeometryBox.ContentBox -> {
            // ContentBox = BorderBox + padding
            RectF(
                bounds.left + view.paddingLeft,
                bounds.top + view.paddingTop,
                bounds.right - view.paddingRight,
                bounds.bottom - view.paddingBottom
        )
          }

          GeometryBox.PaddingBox -> {
            // PaddingBox = BorderBox - border
            RectF(
                bounds.left + (computedBorderInsets?.left?.dpToPx() ?: 0f),
                bounds.top + (computedBorderInsets?.top?.dpToPx() ?: 0f),
                bounds.right - (computedBorderInsets?.right?.dpToPx() ?: 0f),
                bounds.bottom - (computedBorderInsets?.bottom?.dpToPx() ?: 0f)
        )
          }

          GeometryBox.MarginBox -> {
            // MarginBox = BorderBox + margin
            RectF(
                bounds.left - (params?.leftMargin?.dpToPx() ?: 0f),
                bounds.top - (params?.topMargin?.dpToPx() ?: 0f),
                bounds.right + (params?.rightMargin?.dpToPx() ?: 0f),
                bounds.bottom + (params?.bottomMargin?.dpToPx() ?: 0f)
        )
          }

      GeometryBox.BorderBox, null -> {
            // BorderBox = view bounds
            bounds
          }

          else -> bounds // StrokeBox, ViewBox - use border-box as fallback
        }
    return box
  }
}
