/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.Outline
import android.graphics.Path
import android.graphics.RectF
import android.graphics.drawable.Drawable
import android.graphics.drawable.LayerDrawable
import android.os.Build
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.uimanager.style.BorderInsets
import com.facebook.react.uimanager.style.BorderRadiusStyle

/**
 * CompositeBackgroundDrawable can overlay multiple different layers, shadows, and native effects
 * such as ripple, into an Android View's background drawable.
 */
@OptIn(UnstableReactNativeAPI::class)
internal class CompositeBackgroundDrawable(
    private val context: Context,
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

    /** Background rendering Layer */
    public val background: BackgroundDrawable? = null,

    /** Border rendering Layer */
    public val border: BorderDrawable? = null,

    /** TouchableNativeFeeback set selection background, like "SelectableBackground" */
    public val feedbackUnderlay: Drawable? = null,

    /** Inset box-shadows */
    public val innerShadows: List<Drawable> = emptyList(),

    /** Outline */
    public val outline: OutlineDrawable? = null,

    // Holder value for currently set insets
    public var borderInsets: BorderInsets? = null,

    // Holder value for currently set border radius
    public var borderRadius: BorderRadiusStyle? = null,
) :
    LayerDrawable(
        createLayersArray(
            originalBackground,
            outerShadows,
            cssBackground,
            background,
            border,
            feedbackUnderlay,
            innerShadows,
            outline)) {

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
        context,
        originalBackground,
        outerShadows,
        cssBackground,
        background,
        border,
        feedbackUnderlay,
        innerShadows,
        outline,
        borderInsets,
        borderRadius,
    )
  }

  public fun withNewBackground(background: BackgroundDrawable?): CompositeBackgroundDrawable {
    return CompositeBackgroundDrawable(
        context,
        originalBackground,
        outerShadows,
        cssBackground,
        background,
        border,
        feedbackUnderlay,
        innerShadows,
        outline,
        borderInsets,
        borderRadius,
    )
  }

  public fun withNewShadows(
      outerShadows: List<Drawable>,
      innerShadows: List<Drawable>
  ): CompositeBackgroundDrawable {
    return CompositeBackgroundDrawable(
        context,
        originalBackground,
        outerShadows,
        cssBackground,
        background,
        border,
        feedbackUnderlay,
        innerShadows,
        outline,
        borderInsets,
        borderRadius,
    )
  }

  public fun withNewBorder(border: BorderDrawable): CompositeBackgroundDrawable {
    return CompositeBackgroundDrawable(
        context,
        originalBackground,
        outerShadows,
        cssBackground,
        background,
        border,
        feedbackUnderlay,
        innerShadows,
        outline,
        borderInsets,
        borderRadius,
    )
  }

  public fun withNewOutline(outline: OutlineDrawable): CompositeBackgroundDrawable {
    return CompositeBackgroundDrawable(
        context,
        originalBackground,
        outerShadows,
        cssBackground,
        background,
        border,
        feedbackUnderlay,
        innerShadows,
        outline,
        borderInsets,
        borderRadius,
    )
  }

  public fun withNewFeedbackUnderlay(newUnderlay: Drawable?): CompositeBackgroundDrawable {
    return CompositeBackgroundDrawable(
        context,
        originalBackground,
        outerShadows,
        cssBackground,
        background,
        border,
        newUnderlay,
        innerShadows,
        outline,
        borderInsets,
        borderRadius,
    )
  }

  /* Android's elevation implementation requires this to be implemented to know where to draw the
  elevation shadow. */
  override fun getOutline(outline: Outline) {
    if (borderRadius?.hasRoundedBorders() == true) {
      val pathForOutline = Path()

      val computedBorderRadius =
          borderRadius?.resolve(
              layoutDirection, context, bounds.width().toFloat(), bounds.height().toFloat())

      val computedBorderInsets = borderInsets?.resolve(layoutDirection, context)

      computedBorderRadius?.let {
        pathForOutline.addRoundRect(
            RectF(bounds),
            floatArrayOf(
                it.topLeft.horizontal + (computedBorderInsets?.left ?: 0f),
                it.topLeft.vertical + (computedBorderInsets?.top ?: 0f),
                it.topRight.horizontal + (computedBorderInsets?.right ?: 0f),
                it.topRight.vertical + (computedBorderInsets?.top ?: 0f),
                it.bottomRight.horizontal + (computedBorderInsets?.right ?: 0f),
                it.bottomRight.vertical + (computedBorderInsets?.bottom ?: 0f),
                it.bottomLeft.horizontal + (computedBorderInsets?.left ?: 0f),
                it.bottomLeft.vertical) + (computedBorderInsets?.bottom ?: 0f),
            Path.Direction.CW)
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        outline.setPath(pathForOutline)
      } else {
        @Suppress("DEPRECATION") outline.setConvexPath(pathForOutline)
      }
    } else {
      outline.setRect(bounds)
    }
  }

  companion object {
    private fun createLayersArray(
        originalBackground: Drawable?,
        outerShadows: List<Drawable>,
        cssBackground: CSSBackgroundDrawable?,
        background: BackgroundDrawable?,
        border: BorderDrawable?,
        feedbackUnderlay: Drawable?,
        innerShadows: List<Drawable>,
        outline: OutlineDrawable?
    ): Array<Drawable?> {
      val layers = mutableListOf<Drawable?>()
      originalBackground?.let { layers.add(it) }
      layers.addAll(outerShadows.asReversed())
      cssBackground?.let { layers.add(it) }
      background?.let { layers.add(it) }
      border?.let { layers.add(it) }
      feedbackUnderlay?.let { layers.add(it) }
      layers.addAll(innerShadows.asReversed())
      outline?.let { layers.add(it) }
      return layers.toTypedArray()
    }
  }
}
