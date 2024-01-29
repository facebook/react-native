/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.attributedstring

import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.AS_KEY_FRAGMENTS

/** An [AttributedString] backed by a [MapBuffer] */
internal class MapBufferAttributedString(private val attributedString: MapBuffer) : AttributedString {
  override fun getFragment(index: Int): AttributedStringFragment =
    MapBufferAttributedStringFragment(fragments.getMapBuffer(index))

  override val fragmentCount: Int
    get() = fragments.count

  private val fragments: MapBuffer
    get() = attributedString.getMapBuffer(AS_KEY_FRAGMENTS.toInt())
}
