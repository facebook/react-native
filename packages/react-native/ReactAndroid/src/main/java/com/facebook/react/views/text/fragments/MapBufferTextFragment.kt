package com.facebook.react.views.text.fragments

import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.views.text.TextAttributeProps

import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_HEIGHT
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_IS_ATTACHMENT
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_REACT_TAG
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_STRING
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_TEXT_ATTRIBUTES
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.FR_KEY_WIDTH

/**
 * A [TextFragment] implementation backed by a [MapBuffer]
 */
internal class MapBufferTextFragment(private val fragment: MapBuffer) : TextFragment {
  override fun getTextAttributeProps(): TextAttributeProps =
    TextAttributeProps.fromMapBuffer(fragment.getMapBuffer(FR_KEY_TEXT_ATTRIBUTES.toInt()))

  override fun getString(): String = fragment.getString(FR_KEY_STRING.toInt())

  override fun hasReactTag(): Boolean = fragment.contains(FR_KEY_REACT_TAG.toInt())

  override fun getReactTag(): Int = fragment.getInt(FR_KEY_REACT_TAG.toInt())

  override fun hasIsAttachment(): Boolean = fragment.contains(FR_KEY_IS_ATTACHMENT.toInt())

  override fun isAttachment(): Boolean = fragment.getBoolean(FR_KEY_IS_ATTACHMENT.toInt())

  override fun getWidth(): Double = fragment.getDouble(FR_KEY_WIDTH.toInt())

  override fun getHeight(): Double = fragment.getDouble(FR_KEY_HEIGHT.toInt())
}
