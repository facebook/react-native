/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import java.util.Objects

/**
 * Data structure that couples view tag to it's index in parent view. Used for managing children
 * operation.
 */
@LegacyArchitecture
public class ViewAtIndex(
    @Suppress("NoHungarianNotation") @JvmField public val mTag: Int,
    @Suppress("NoHungarianNotation") @JvmField public val mIndex: Int
) {

  override fun equals(other: Any?): Boolean {
    if (other == null || other.javaClass != javaClass) {
      return false
    }
    val otherViewAtIndex = other as ViewAtIndex
    return mIndex == otherViewAtIndex.mIndex && mTag == otherViewAtIndex.mTag
  }

  override fun hashCode(): Int = Objects.hash(mTag, mIndex)

  override fun toString(): String = "[$mTag, $mIndex]"

  public companion object {
    @JvmField
    public var COMPARATOR: Comparator<ViewAtIndex> = Comparator { lhs, rhs ->
      lhs.mIndex - rhs.mIndex
    }

    init {
      LegacyArchitectureLogger.assertWhenLegacyArchitectureMinifyingEnabled(
          "ViewAtIndex", LegacyArchitectureLogLevel.WARNING)
    }
  }
}
