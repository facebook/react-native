/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.fragments

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.views.text.TextAttributeProps

/** A [TextFragment] implementation backed by a a [ReadableMap] */
internal class BridgeTextFragment(private val fragment: ReadableMap) : TextFragment {
  override val textAttributeProps: TextAttributeProps
    get() =
        TextAttributeProps.fromReadableMap(ReactStylesDiffMap(fragment.getMap("textAttributes")))

  override val string: String?
    get() = fragment.getString("string")

  override fun hasReactTag(): Boolean = fragment.hasKey("reactTag")

  override val reactTag: Int
    get() = fragment.getInt("reactTag")

  override fun hasIsAttachment(): Boolean = fragment.hasKey(ViewProps.IS_ATTACHMENT)

  override val isAttachment: Boolean
    get() = fragment.getBoolean(ViewProps.IS_ATTACHMENT)

  override val width: Double
    get() = fragment.getDouble(ViewProps.WIDTH)

  override val height: Double
    get() = fragment.getDouble(ViewProps.HEIGHT)
}
