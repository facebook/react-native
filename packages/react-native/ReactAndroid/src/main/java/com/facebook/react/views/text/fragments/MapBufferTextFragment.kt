/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.fragments

import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.views.text.TextAttributeProps
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.TF_KEY_HEIGHT
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.TF_KEY_IS_ATTACHMENT
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.TF_KEY_REACT_TAG
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.TF_KEY_STRING
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.TF_KEY_TEXT_ATTRIBUTES
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.TF_KEY_WIDTH

/** A [TextFragment] implementation backed by a [MapBuffer] */
internal class MapBufferTextFragment(private val fragment: MapBuffer) : TextFragment {
  override val textAttributeProps: TextAttributeProps
    get() = TextAttributeProps.fromMapBuffer(fragment.getMapBuffer(TF_KEY_TEXT_ATTRIBUTES.toInt()))

  override val string: String
    get() = fragment.getString(TF_KEY_STRING.toInt())

  override fun hasReactTag(): Boolean = fragment.contains(TF_KEY_REACT_TAG.toInt())

  override val reactTag: Int
    get() = fragment.getInt(TF_KEY_REACT_TAG.toInt())

  override fun hasIsAttachment(): Boolean = fragment.contains(TF_KEY_IS_ATTACHMENT.toInt())

  override val isAttachment: Boolean
    get() = fragment.getBoolean(TF_KEY_IS_ATTACHMENT.toInt())

  override val width: Double
    get() = fragment.getDouble(TF_KEY_WIDTH.toInt())

  override val height: Double
    get() = fragment.getDouble(TF_KEY_HEIGHT.toInt())
}
