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

/**
 * Represents resolved border colors for all four physical edges of a box.
 *
 * This data class contains the final computed color values after resolving logical properties based
 * on layout direction.
 *
 * @property left Color for the left edge
 * @property top Color for the top edge
 * @property right Color for the right edge
 * @property bottom Color for the bottom edge
 */
internal data class ColorEdges(
    @param:ColorInt val left: Int = Color.BLACK,
    @param:ColorInt val top: Int = Color.BLACK,
    @param:ColorInt val right: Int = Color.BLACK,
    @param:ColorInt val bottom: Int = Color.BLACK,
)

/**
 * Represents border colors using logical edge properties.
 *
 * This inline value class stores colors for all logical edges (start, end, block-start, block-end,
 * etc.) and resolves them to physical edges based on layout direction and RTL settings.
 *
 * @property edgeColors Array of colors indexed by [LogicalEdge] ordinal values
 * @see LogicalEdge
 * @see ColorEdges
 */
@JvmInline
internal value class BorderColors(
    @param:ColorInt val edgeColors: Array<Int?> = arrayOfNulls<Int?>(LogicalEdge.values().size)
) {

  /**
   * Resolves logical edge colors to physical edge colors based on layout direction.
   *
   * This method handles RTL layout direction and the doLeftAndRightSwapInRTL setting to correctly
   * map logical properties (start, end, block-start, block-end) to physical edges (left, right,
   * top, bottom).
   *
   * @param layoutDirection The resolved layout direction (LTR or RTL)
   * @param context Android context for RTL swap preference
   * @return ColorEdges with resolved physical edge colors
   * @throws IllegalArgumentException if layoutDirection is not LTR or RTL
   */
  fun resolve(layoutDirection: Int, context: Context): ColorEdges {
    // Fix for issue #38335: borderBottomColor does not override borderColor on Android
    // Physical edge colors (LEFT, RIGHT, TOP, BOTTOM) should have higher priority than
    // logical block colors (BLOCK_START, BLOCK_END, BLOCK) and shorthand colors (ALL, HORIZONTAL, VERTICAL)
    // This ensures that setting borderBottomColor properly overrides borderBlockColor
    return when (layoutDirection) {
      LayoutDirection.LTR ->
          ColorEdges(
              // Left: START > LEFT > HORIZONTAL > ALL
              edgeColors[LogicalEdge.START.ordinal]
                  ?: edgeColors[LogicalEdge.LEFT.ordinal]
                  ?: edgeColors[LogicalEdge.HORIZONTAL.ordinal]
                  ?: edgeColors[LogicalEdge.ALL.ordinal]
                  ?: Color.BLACK,
              // Top: Physical edge (TOP) > BLOCK_START > BLOCK > VERTICAL > ALL
              edgeColors[LogicalEdge.TOP.ordinal]
                  ?: edgeColors[LogicalEdge.BLOCK_START.ordinal]
                  ?: edgeColors[LogicalEdge.BLOCK.ordinal]
                  ?: edgeColors[LogicalEdge.VERTICAL.ordinal]
                  ?: edgeColors[LogicalEdge.ALL.ordinal]
                  ?: Color.BLACK,
              // Right: END > RIGHT > HORIZONTAL > ALL
              edgeColors[LogicalEdge.END.ordinal]
                  ?: edgeColors[LogicalEdge.RIGHT.ordinal]
                  ?: edgeColors[LogicalEdge.HORIZONTAL.ordinal]
                  ?: edgeColors[LogicalEdge.ALL.ordinal]
                  ?: Color.BLACK,
              // Bottom: Physical edge (BOTTOM) > BLOCK_END > BLOCK > VERTICAL > ALL
              edgeColors[LogicalEdge.BOTTOM.ordinal]
                  ?: edgeColors[LogicalEdge.BLOCK_END.ordinal]
                  ?: edgeColors[LogicalEdge.BLOCK.ordinal]
                  ?: edgeColors[LogicalEdge.VERTICAL.ordinal]
                  ?: edgeColors[LogicalEdge.ALL.ordinal]
                  ?: Color.BLACK,
          )
      LayoutDirection.RTL ->
          if (I18nUtil.instance.doLeftAndRightSwapInRTL(context)) {
            // RTL with doLeftAndRightSwapInRTL: START/END swap with LEFT/RIGHT
            ColorEdges(
                // Left (becomes RTL right): END > RIGHT > HORIZONTAL > ALL
                edgeColors[LogicalEdge.END.ordinal]
                    ?: edgeColors[LogicalEdge.RIGHT.ordinal]
                    ?: edgeColors[LogicalEdge.HORIZONTAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK,
                // Top: Physical edge (TOP) > BLOCK_START > BLOCK > VERTICAL > ALL
                edgeColors[LogicalEdge.TOP.ordinal]
                    ?: edgeColors[LogicalEdge.BLOCK_START.ordinal]
                    ?: edgeColors[LogicalEdge.BLOCK.ordinal]
                    ?: edgeColors[LogicalEdge.VERTICAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK,
                // Right (becomes RTL left): START > LEFT > HORIZONTAL > ALL
                edgeColors[LogicalEdge.START.ordinal]
                    ?: edgeColors[LogicalEdge.LEFT.ordinal]
                    ?: edgeColors[LogicalEdge.HORIZONTAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK,
                // Bottom: Physical edge (BOTTOM) > BLOCK_END > BLOCK > VERTICAL > ALL
                edgeColors[LogicalEdge.BOTTOM.ordinal]
                    ?: edgeColors[LogicalEdge.BLOCK_END.ordinal]
                    ?: edgeColors[LogicalEdge.BLOCK.ordinal]
                    ?: edgeColors[LogicalEdge.VERTICAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK,
            )
          } else {
            // RTL without swap: START/END don't affect LEFT/RIGHT
            ColorEdges(
                // Left: END > LEFT > HORIZONTAL > ALL
                edgeColors[LogicalEdge.END.ordinal]
                    ?: edgeColors[LogicalEdge.LEFT.ordinal]
                    ?: edgeColors[LogicalEdge.HORIZONTAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK,
                // Top: Physical edge (TOP) > BLOCK_START > BLOCK > VERTICAL > ALL
                edgeColors[LogicalEdge.TOP.ordinal]
                    ?: edgeColors[LogicalEdge.BLOCK_START.ordinal]
                    ?: edgeColors[LogicalEdge.BLOCK.ordinal]
                    ?: edgeColors[LogicalEdge.VERTICAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK,
                // Right: START > RIGHT > HORIZONTAL > ALL
                edgeColors[LogicalEdge.START.ordinal]
                    ?: edgeColors[LogicalEdge.RIGHT.ordinal]
                    ?: edgeColors[LogicalEdge.HORIZONTAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK,
                // Bottom: Physical edge (BOTTOM) > BLOCK_END > BLOCK > VERTICAL > ALL
                edgeColors[LogicalEdge.BOTTOM.ordinal]
                    ?: edgeColors[LogicalEdge.BLOCK_END.ordinal]
                    ?: edgeColors[LogicalEdge.BLOCK.ordinal]
                    ?: edgeColors[LogicalEdge.VERTICAL.ordinal]
                    ?: edgeColors[LogicalEdge.ALL.ordinal]
                    ?: Color.BLACK,
            )
          }
      else -> throw IllegalArgumentException("Expected resolved layout direction")
    }
  }
}
