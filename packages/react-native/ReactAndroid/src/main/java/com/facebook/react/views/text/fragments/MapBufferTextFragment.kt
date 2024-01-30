/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.fragments

import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.views.text.TextAttributeProps
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_HEIGHT
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_IS_ATTACHMENT
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_REACT_TAG
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_STRING
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_TEXT_ATTRIBUTES
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_WIDTH

/** A [TextFragment] implementation backed by a [MapBuffer] */
internal class MapBufferTextFragment(private val fragment: MapBuffer) : TextFragment {
  override val textAttributeProps: TextAttributeProps
    get() = TextAttributeProps.fromMapBuffer(fragment.getMapBuffer(FR_KEY_TEXT_ATTRIBUTES.toInt()))

  override val string: String
    get() = fragment.getString(FR_KEY_STRING.toInt())

  override fun hasReactTag(): Boolean = fragment.contains(FR_KEY_REACT_TAG.toInt())

  override val reactTag: Int
    get() = fragment.getInt(FR_KEY_REACT_TAG.toInt())

  override fun hasIsAttachment(): Boolean = fragment.contains(FR_KEY_IS_ATTACHMENT.toInt())

  override val isAttachment: Boolean
    get() = fragment.getBoolean(FR_KEY_IS_ATTACHMENT.toInt())

  override val width: Double
    get() = fragment.getDouble(FR_KEY_WIDTH.toInt())

  override val height: Double
    get() = fragment.getDouble(FR_KEY_HEIGHT.toInt())
}
