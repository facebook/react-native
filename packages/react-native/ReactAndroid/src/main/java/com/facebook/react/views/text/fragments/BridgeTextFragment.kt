package com.facebook.react.views.text.fragments

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.views.text.TextAttributeProps

/**
 * A [TextFragment] implementation backed by a a [ReadableMap]
 */
internal class BridgeTextFragment(private val mFragment: ReadableMap) : TextFragment {
  override fun getTextAttributeProps(): TextAttributeProps =
    TextAttributeProps.fromReadableMap(ReactStylesDiffMap(mFragment.getMap("textAttributes")))

  override fun getString(): String? = mFragment.getString("string")

  override fun hasReactTag(): Boolean = mFragment.hasKey("reactTag")

  override fun getReactTag(): Int = mFragment.getInt("reactTag")

  override fun hasIsAttachment(): Boolean = mFragment.hasKey(ViewProps.IS_ATTACHMENT)

  override fun isAttachment(): Boolean = mFragment.getBoolean(ViewProps.IS_ATTACHMENT)

  override fun getWidth(): Double = mFragment.getDouble(ViewProps.WIDTH)

  override fun getHeight(): Double = mFragment.getDouble(ViewProps.HEIGHT)
}
