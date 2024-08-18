/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.graphics.drawable.Drawable
import android.graphics.drawable.LayerDrawable
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.uimanager.style.BorderInsets

/**
 * CompositeBackgroundDrawable can overlay multiple different layers, shadows, and native effects
 * such as ripple, into an Android View's background drawable.
 */
@OptIn(UnstableReactNativeAPI::class)
internal class CompositeBackgroundDrawable(
    /**
     * Any non-react-managed background already part of the view, like one set as Android style on a
     * TextInput
     */
    public val originalBackground: Drawable? = null,

    /** Non-inset box shadows */
    public val outerShadows: List<Drawable> = emptyList(),

    /**
     * CSS background layer and border rendering
     *
     * TODO: we should extract path logic from here, and fast-path to using simpler drawables like
     *   ColorDrawable in the common cases
     */
    public val cssBackground: CSSBackgroundDrawable? = null,

    /** TouchableNativeFeeback set selection background, like "SelectableBackground" */
    public val feedbackUnderlay: Drawable? = null,

    /** Inset box-shadows */
    public val innerShadows: List<Drawable> = emptyList(),
) :
    LayerDrawable(
        listOfNotNull(
                originalBackground,
                // z-ordering of user-provided shadow-list is opposite direction of LayerDrawable
                // z-ordering
                // https://drafts.csswg.org/css-backgrounds/#shadow-layers
                *outerShadows.asReversed().toTypedArray(),
                cssBackground,
                feedbackUnderlay,
                *innerShadows.asReversed().toTypedArray())
            .toTypedArray()) {

  // Holder value for currently set insets
  public var borderInsets: BorderInsets? = null

  init {
    // We want to overlay drawables, instead of placing future drawables within the content area of
    // previous ones. E.g. an EditText style may set padding on a TextInput, but we don't want to
    // constrain background color to the area inside of the padding.
    setPaddingMode(LayerDrawable.PADDING_MODE_STACK)
  }

  public fun withNewCssBackground(
      cssBackground: CSSBackgroundDrawable?
  ): CompositeBackgroundDrawable {
    return CompositeBackgroundDrawable(
        originalBackground, outerShadows, cssBackground, feedbackUnderlay, innerShadows)
  }

  public fun withNewShadows(
      outerShadows: List<Drawable>,
      innerShadows: List<Drawable>
  ): CompositeBackgroundDrawable {
    return CompositeBackgroundDrawable(
        originalBackground, outerShadows, cssBackground, feedbackUnderlay, innerShadows)
  }

  public fun withNewFeedbackUnderlay(newUnderlay: Drawable?): CompositeBackgroundDrawable {
    return CompositeBackgroundDrawable(
        originalBackground, outerShadows, cssBackground, newUnderlay, innerShadows)
  }
}
