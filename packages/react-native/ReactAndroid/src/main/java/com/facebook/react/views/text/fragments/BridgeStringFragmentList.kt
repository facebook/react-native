/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.fragments

import com.facebook.react.bridge.ReadableArray

/** A list of [TextFragment]s backed by a [ReadableArray] */
internal class BridgeStringFragmentList(private val fragments: ReadableArray) : StringFragmentList {
  override fun getFragment(index: Int): TextFragment = BridgeTextFragment(fragments.getMap(index))

  override val count: Int
    get() = fragments.size()
}
