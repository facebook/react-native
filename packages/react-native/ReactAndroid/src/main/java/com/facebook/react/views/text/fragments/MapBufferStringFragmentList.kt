/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.fragments

import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_KIND
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_VALUE_KIND_SPAN
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_VALUE_KIND_TEXT

/** A list of [TextFragment]s backed by a [MapBuffer] */
internal class MapBufferStringFragmentList(private val fragments: MapBuffer) : StringFragmentList {
  override fun getFragment(index: Int): StringFragment {
    val fragment = fragments.getMapBuffer(index)

    return when (val kind = fragment.getInt(FR_KEY_KIND.toInt()).toShort()) {
      FR_VALUE_KIND_TEXT -> MapBufferTextFragment(fragment)
      FR_VALUE_KIND_SPAN -> MapBufferSpanFragment(fragment)
      else -> throw IllegalArgumentException("Unsupported fragment kind: $kind")
    }
  }

  override val count: Int
    get() = fragments.count
}
