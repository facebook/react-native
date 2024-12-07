/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import com.facebook.react.uimanager.Spacing
import java.lang.IllegalArgumentException

/** Represents the collection of possible box edges and shorthands. */
public enum class LogicalEdge {
  ALL {
    override fun toSpacingType(): Int = Spacing.ALL
  },
  LEFT {
    override fun toSpacingType(): Int = Spacing.LEFT
  },
  RIGHT {
    override fun toSpacingType(): Int = Spacing.RIGHT
  },
  TOP {
    override fun toSpacingType(): Int = Spacing.TOP
  },
  BOTTOM {
    override fun toSpacingType(): Int = Spacing.BOTTOM
  },
  START {
    override fun toSpacingType(): Int = Spacing.START
  },
  END {
    override fun toSpacingType(): Int = Spacing.END
  },
  HORIZONTAL {
    override fun toSpacingType(): Int = Spacing.HORIZONTAL
  },
  VERTICAL {
    override fun toSpacingType(): Int = Spacing.VERTICAL
  },
  BLOCK_START {
    override fun toSpacingType(): Int = Spacing.BLOCK_START
  },
  BLOCK_END {
    override fun toSpacingType(): Int = Spacing.BLOCK_END
  },
  BLOCK {
    override fun toSpacingType(): Int = Spacing.BLOCK
  };

  // TODO: not supported by Spacing users
  // INLINE_START,
  // INLINE_END,
  // INLINE;

  abstract public fun toSpacingType(): Int

  public companion object {
    @JvmStatic
    public fun fromSpacingType(spacingType: Int): LogicalEdge {
      return when (spacingType) {
        Spacing.ALL -> ALL
        Spacing.LEFT -> LEFT
        Spacing.RIGHT -> RIGHT
        Spacing.TOP -> TOP
        Spacing.BOTTOM -> BOTTOM
        Spacing.START -> START
        Spacing.END -> END
        Spacing.HORIZONTAL -> HORIZONTAL
        Spacing.VERTICAL -> VERTICAL
        Spacing.BLOCK_START -> BLOCK_START
        Spacing.BLOCK_END -> BLOCK_END
        Spacing.BLOCK -> BLOCK
        else -> throw IllegalArgumentException("Unknown spacing type: $spacingType")
      }
    }
  }
}
