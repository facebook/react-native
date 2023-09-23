package com.facebook.react.views.text.fragments

import com.facebook.react.common.mapbuffer.MapBuffer

/**
 * A list of [TextFragment]s backed by a [MapBuffer]
 */
internal class MapBufferTextFragmentList(private val mFragments: MapBuffer) : TextFragmentList {
  override fun getFragment(index: Int): TextFragment =
    MapBufferTextFragment(mFragments.getMapBuffer(index))

  override val count: Int
    get() = mFragments.count
}
