/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.fragments

import com.facebook.react.common.mapbuffer.MapBuffer

/** A list of [TextFragment]s backed by a [MapBuffer] */
internal class MapBufferTextFragmentList(private val fragments: MapBuffer) : TextFragmentList {
  override fun getFragment(index: Int): TextFragment =
      MapBufferTextFragment(fragments.getMapBuffer(index))

  override val count: Int
    get() = fragments.count
}
