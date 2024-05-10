/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

/** Phsysical edge lengths (in DIPs) for a border-radius. */
public data class ComputedBorderRadius(
    val topLeft: Float,
    val topRight: Float,
    val bottomLeft: Float,
    val bottomRight: Float,
) {
  public fun hasRoundedBorders(): Boolean {
    return topLeft > 0f || topRight > 0f || bottomLeft > 0f || bottomRight > 0f
  }

  public constructor() : this(0f, 0f, 0f, 0f)
}
