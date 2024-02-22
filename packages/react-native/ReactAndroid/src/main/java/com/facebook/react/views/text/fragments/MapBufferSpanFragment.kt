/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.fragments

import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.views.text.SpanAttributeProps
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.SF_KEY_FRAGMENTS
import com.facebook.react.views.text.TextLayoutManagerMapBuffer.SF_KEY_SPAN_ATTRIBUTES

/** A [SpanFragment] implementation backed by a [MapBuffer] */
internal class MapBufferSpanFragment(private val fragment: MapBuffer) : SpanFragment {
  override val spanAttributeProps: SpanAttributeProps
    get() = SpanAttributeProps.fromMapBuffer(fragment.getMapBuffer(SF_KEY_SPAN_ATTRIBUTES.toInt()))

  override val subFragmentList: StringFragmentList
    get() = MapBufferStringFragmentList(fragments = fragment.getMapBuffer(SF_KEY_FRAGMENTS.toInt()))
}
