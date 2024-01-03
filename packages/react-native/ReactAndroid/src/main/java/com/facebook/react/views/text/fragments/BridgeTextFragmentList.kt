package com.facebook.react.views.text.fragments

import com.facebook.react.bridge.ReadableArray

/**
 * A list of [TextFragment]s backed by a [ReadableArray]
 */
internal class BridgeTextFragmentList(private val fragments: ReadableArray) : TextFragmentList {
  override fun getFragment(index: Int): TextFragment = BridgeTextFragment(fragments.getMap(index))

  override val count: Int
    get() = fragments.size()
}
