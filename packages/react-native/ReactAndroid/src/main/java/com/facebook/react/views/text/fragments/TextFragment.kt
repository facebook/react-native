package com.facebook.react.views.text.fragments

import com.facebook.react.views.text.TextAttributeProps

/**
 * Interface for a text fragment
 */
internal interface TextFragment {
  val textAttributeProps: TextAttributeProps

  val string: String?

  fun hasReactTag(): Boolean

  val reactTag: Int

  fun hasIsAttachment(): Boolean

  val isAttachment: Boolean

  val width: Double

  val height: Double
}
