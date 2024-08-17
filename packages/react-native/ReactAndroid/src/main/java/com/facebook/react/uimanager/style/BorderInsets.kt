/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.content.Context
import android.graphics.RectF
import android.util.LayoutDirection
import com.facebook.react.modules.i18nmanager.I18nUtil

/** Represents the insets from border pox to padding box (i.e. border widths) */
internal class BorderInsets {
  private val edgeInsets = arrayOfNulls<Float?>(LogicalEdge.values().size)

  public fun setBorderWidth(edge: LogicalEdge, width: Float?) {
    edgeInsets[edge.ordinal] = width
  }

  public fun resolve(
      layoutDirection: Int,
      context: Context,
  ): RectF {
    return when (layoutDirection) {
      LayoutDirection.LTR ->
          RectF(
              edgeInsets[LogicalEdge.START.ordinal]
                  ?: edgeInsets[LogicalEdge.LEFT.ordinal]
                  ?: edgeInsets[LogicalEdge.HORIZONTAL.ordinal]
                  ?: edgeInsets[LogicalEdge.ALL.ordinal]
                  ?: 0f,
              edgeInsets[LogicalEdge.BLOCK_START.ordinal]
                  ?: edgeInsets[LogicalEdge.TOP.ordinal]
                  ?: edgeInsets[LogicalEdge.BLOCK.ordinal]
                  ?: edgeInsets[LogicalEdge.VERTICAL.ordinal]
                  ?: edgeInsets[LogicalEdge.ALL.ordinal]
                  ?: 0f,
              edgeInsets[LogicalEdge.END.ordinal]
                  ?: edgeInsets[LogicalEdge.RIGHT.ordinal]
                  ?: edgeInsets[LogicalEdge.HORIZONTAL.ordinal]
                  ?: edgeInsets[LogicalEdge.ALL.ordinal]
                  ?: 0f,
              edgeInsets[LogicalEdge.BLOCK_END.ordinal]
                  ?: edgeInsets[LogicalEdge.BOTTOM.ordinal]
                  ?: edgeInsets[LogicalEdge.BLOCK.ordinal]
                  ?: edgeInsets[LogicalEdge.VERTICAL.ordinal]
                  ?: edgeInsets[LogicalEdge.ALL.ordinal]
                  ?: 0f)
      LayoutDirection.RTL ->
          if (I18nUtil.instance.doLeftAndRightSwapInRTL(context)) {
            RectF(
                edgeInsets[LogicalEdge.END.ordinal]
                    ?: edgeInsets[LogicalEdge.RIGHT.ordinal]
                    ?: edgeInsets[LogicalEdge.HORIZONTAL.ordinal]
                    ?: edgeInsets[LogicalEdge.ALL.ordinal]
                    ?: 0f,
                edgeInsets[LogicalEdge.BLOCK_START.ordinal]
                    ?: edgeInsets[LogicalEdge.TOP.ordinal]
                    ?: edgeInsets[LogicalEdge.BLOCK.ordinal]
                    ?: edgeInsets[LogicalEdge.VERTICAL.ordinal]
                    ?: edgeInsets[LogicalEdge.ALL.ordinal]
                    ?: 0f,
                edgeInsets[LogicalEdge.START.ordinal]
                    ?: edgeInsets[LogicalEdge.LEFT.ordinal]
                    ?: edgeInsets[LogicalEdge.HORIZONTAL.ordinal]
                    ?: edgeInsets[LogicalEdge.ALL.ordinal]
                    ?: 0f,
                edgeInsets[LogicalEdge.BLOCK_END.ordinal]
                    ?: edgeInsets[LogicalEdge.BOTTOM.ordinal]
                    ?: edgeInsets[LogicalEdge.BLOCK.ordinal]
                    ?: edgeInsets[LogicalEdge.VERTICAL.ordinal]
                    ?: edgeInsets[LogicalEdge.ALL.ordinal]
                    ?: 0f)
          } else {
            RectF(
                edgeInsets[LogicalEdge.END.ordinal]
                    ?: edgeInsets[LogicalEdge.LEFT.ordinal]
                    ?: edgeInsets[LogicalEdge.HORIZONTAL.ordinal]
                    ?: edgeInsets[LogicalEdge.ALL.ordinal]
                    ?: 0f,
                edgeInsets[LogicalEdge.BLOCK_START.ordinal]
                    ?: edgeInsets[LogicalEdge.TOP.ordinal]
                    ?: edgeInsets[LogicalEdge.BLOCK.ordinal]
                    ?: edgeInsets[LogicalEdge.VERTICAL.ordinal]
                    ?: edgeInsets[LogicalEdge.ALL.ordinal]
                    ?: 0f,
                edgeInsets[LogicalEdge.START.ordinal]
                    ?: edgeInsets[LogicalEdge.RIGHT.ordinal]
                    ?: edgeInsets[LogicalEdge.HORIZONTAL.ordinal]
                    ?: edgeInsets[LogicalEdge.ALL.ordinal]
                    ?: 0f,
                edgeInsets[LogicalEdge.BLOCK_END.ordinal]
                    ?: edgeInsets[LogicalEdge.BOTTOM.ordinal]
                    ?: edgeInsets[LogicalEdge.BLOCK.ordinal]
                    ?: edgeInsets[LogicalEdge.VERTICAL.ordinal]
                    ?: edgeInsets[LogicalEdge.ALL.ordinal]
                    ?: 0f)
          }
      else -> throw IllegalArgumentException("Expected resolved layout direction")
    }
  }
}
