/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.views.text

import com.facebook.react.common.ReactConstants
import com.facebook.react.common.mapbuffer.MapBuffer
import kotlin.math.roundToInt

public class SpanAttributeProps private constructor(
  public val textAttributeProps: TextAttributeProps,
) {
  public companion object {
    // constants for Span Attributes serialization
    private const val SA_KEY_TEXT_ATTRIBUTES: Short = 0

    /**
     * Build a TextAttributeProps using data from the [MapBuffer] received as a parameter.
     */
    public fun fromMapBuffer(props: MapBuffer): SpanAttributeProps {
      return SpanAttributeProps(
        textAttributeProps = TextAttributeProps.fromMapBuffer(props.getMapBuffer(SA_KEY_TEXT_ATTRIBUTES.toInt()))
      )
    }
  }
}
