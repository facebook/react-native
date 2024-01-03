package com.facebook.react.views.text.fragments

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.views.text.TextAttributeProps

/**
 * A [TextFragment] implementation backed by a a [ReadableMap]
 */
internal class BridgeTextFragment(private val fragment: ReadableMap) : TextFragment {
  override fun getTextAttributeProps(): TextAttributeProps =
    TextAttributeProps.fromReadableMap(ReactStylesDiffMap(fragment.getMap("textAttributes")))

  override fun getString(): String? = fragment.getString("string")

  override fun hasReactTag(): Boolean = fragment.hasKey("reactTag")

  override fun getReactTag(): Int = fragment.getInt("reactTag")

  override fun hasIsAttachment(): Boolean = fragment.hasKey(ViewProps.IS_ATTACHMENT)

  override fun isAttachment(): Boolean = fragment.getBoolean(ViewProps.IS_ATTACHMENT)

  override fun getWidth(): Double = fragment.getDouble(ViewProps.WIDTH)

  override fun getHeight(): Double = fragment.getDouble(ViewProps.HEIGHT)
}
