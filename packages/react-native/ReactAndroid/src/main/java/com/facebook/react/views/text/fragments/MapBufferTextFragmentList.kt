/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.fragments

import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_KIND
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_VALUE_KIND_TEXT

/** A list of [TextFragment]s backed by a [MapBuffer] */
internal class MapBufferTextFragmentList(private val fragments: MapBuffer) : TextFragmentList {
  private val textFragments = (0 until fragments.count).map { fragments.getMapBuffer(it) }.filter {
    // TODO(cubuspl42): Load span fragments
    it.getInt(FR_KEY_KIND.toInt()).toShort() == FR_VALUE_KIND_TEXT
  }

  override fun getFragment(index: Int): TextFragment =
      MapBufferTextFragment(textFragments[index])

  override val count: Int
    get() = textFragments.size
}
