/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.content.Context
import android.graphics.Color
import android.util.LayoutDirection
import androidx.annotation.ColorInt
import com.facebook.react.modules.i18nmanager.I18nUtil

internal data class ColorEdges(
    @ColorInt val left: Int = Color.BLACK,
    @ColorInt val top: Int = Color.BLACK,
    @ColorInt val right: Int = Color.BLACK,
    @ColorInt val bottom: Int = Color.BLACK,
)

@JvmInline
internal value class BorderColors(
    @ColorInt val edgeColors: Array<Int?> = arrayOfNulls<Int?>(LogicalEdge.values().size)
) {

  public fun resolve(layoutDirection: Int, context: Context): ColorEdges {
    return when (layoutDirection) {
      LayoutDirection.LTR ->
          ColorEdges(
              edgeColors[LogicalEdge.START.ordinal]
                  ?: edgeColors[LogicalEdge.LEFT.ordinal]
                  ?: edgeColors[LogicalEdge.HORIZONTAL.ordinal]
                  ?: edgeColors[LogicalEdge.ALL.ordinal]
                  ?: Color.BLACK,
              edgeColors[LogicalEdge.BLOCK_START.ordinal]
                  ?: edgeColors[LogicalEdge.TOP.ordinal]
                  ?: edgeColors[LogicalEdge.BLOCK.ordinal]
                  ?: edgeColors[LogicalEdge.VERTICAL.ordinal]
                  ?: edgeColors[LogicalEdge.ALL.ordinal]
                  ?: Color.BLACK,
              edgeColors[LogicalEdge.END.ordinal]
                  ?: edgeColors[LogicalEdge.RIGHT.ordinal]
                  ?: edgeColors[LogicalEdge.HORIZONTAL.ordinal]
                  ?: edgeColors[LogicalEdge.ALL.ordinal]
                  ?: Color.BLACK,
              edgeColors[LogicalEdge.BLOCK_END.ordinal]
                  ?: edgeColors[LogicalEdge.BOTTOM.ordinal]
                  ?: edgeColors[LogicalEdge.BLOCK.ordinal]
                  ?: edgeColors[LogicalEdge.VERTICAL.ordinal]
                  ?: edgeColors[LogicalEdge.ALL.ordinal]
                  ?: Color.BLACK)
      LayoutDirection.RTL ->
          if (I18nUtil.instance.doLeftAndRightSwapInRTL(context)) {
            ColorEdges(
                edgeColors[LogicalEdge.END.ordinal]
                    ?: edgeColors[LogicalEdge.RIGHT.ordinal]
                    ?: edgeColors[LogicalEdge.HORIZONTAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK,
                edgeColors[LogicalEdge.BLOCK_START.ordinal]
                    ?: edgeColors[LogicalEdge.TOP.ordinal]
                    ?: edgeColors[LogicalEdge.BLOCK.ordinal]
                    ?: edgeColors[LogicalEdge.VERTICAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK,
                edgeColors[LogicalEdge.START.ordinal]
                    ?: edgeColors[LogicalEdge.LEFT.ordinal]
                    ?: edgeColors[LogicalEdge.HORIZONTAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK,
                edgeColors[LogicalEdge.BLOCK_END.ordinal]
                    ?: edgeColors[LogicalEdge.BOTTOM.ordinal]
                    ?: edgeColors[LogicalEdge.BLOCK.ordinal]
                    ?: edgeColors[LogicalEdge.VERTICAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK)
          } else {
            ColorEdges(
                edgeColors[LogicalEdge.END.ordinal]
                    ?: edgeColors[LogicalEdge.LEFT.ordinal]
                    ?: edgeColors[LogicalEdge.HORIZONTAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK,
                edgeColors[LogicalEdge.BLOCK_START.ordinal]
                    ?: edgeColors[LogicalEdge.TOP.ordinal]
                    ?: edgeColors[LogicalEdge.BLOCK.ordinal]
                    ?: edgeColors[LogicalEdge.VERTICAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK,
                edgeColors[LogicalEdge.START.ordinal]
                    ?: edgeColors[LogicalEdge.RIGHT.ordinal]
                    ?: edgeColors[LogicalEdge.HORIZONTAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK,
                edgeColors[LogicalEdge.BLOCK_END.ordinal]
                    ?: edgeColors[LogicalEdge.BOTTOM.ordinal]
                    ?: edgeColors[LogicalEdge.BLOCK.ordinal]
                    ?: edgeColors[LogicalEdge.VERTICAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK)
          }
      else -> throw IllegalArgumentException("Expected resolved layout direction")
    }
  }
}
