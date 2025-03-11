/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.uimanager

/**
 * Data structure that couples view tag to it's index in parent view. Used for managing children
 * operation.
 */
public class ViewAtIndex public constructor(@JvmField public val mTag: Int, @JvmField public val mIndex: Int) {
  override fun equals(obj: Any?): Boolean {
    if (obj == null || obj.javaClass != javaClass) {
      return false
    }
    val other = obj as ViewAtIndex
    return mIndex == other.mIndex && mTag == other.mTag
  }

  override fun toString(): String {
    return "[$mTag, $mIndex]"
  }

  public companion object {
    @JvmField
    public var COMPARATOR: Comparator<ViewAtIndex> =
      Comparator { lhs, rhs -> lhs.mIndex - rhs.mIndex }
  }
}
