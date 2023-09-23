package com.facebook.react.views.text.fragments

import com.facebook.react.views.text.TextAttributeProps

/**
 * Interface for a text fragment
 */
internal interface TextFragment {
  fun getTextAttributeProps(): TextAttributeProps

  fun getString(): String?

  fun hasReactTag(): Boolean

  fun getReactTag(): Int

  fun hasIsAttachment(): Boolean

  fun isAttachment(): Boolean

  fun getWidth(): Double

  fun getHeight(): Double
}
