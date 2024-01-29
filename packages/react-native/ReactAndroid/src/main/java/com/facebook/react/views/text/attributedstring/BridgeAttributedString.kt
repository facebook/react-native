/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.attributedstring

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

/** An [AttributedString] backed by a [ReadableMap] */
internal class BridgeAttributedString(private val attributedString: ReadableMap) : AttributedString {
  override fun getFragment(index: Int): AttributedStringFragment = BridgeAttributedStringFragment(fragments.getMap(index))

  override val fragmentCount: Int
    get() = fragments.size()

  private val fragments: ReadableArray
    get() = attributedString.getArray("fragments")!!
}
