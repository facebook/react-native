package com.facebook.react.views.text.fragments

import com.facebook.react.bridge.ReadableArray

/**
 * A list of [TextFragment]s backed by a [ReadableArray]
 */
internal class BridgeTextFragmentList(private val mFragments: ReadableArray) : TextFragmentList {

  override fun getFragment(index: Int): TextFragment = BridgeTextFragment(mFragments.getMap(index))

  override val count: Int
    get() = mFragments.size()
}
