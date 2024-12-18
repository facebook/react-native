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
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
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
    outerShadows: LayerDrawable? = null,

    /**
     * CSS background layer and border rendering
     *
     * TODO: we should extract path logic from here, and fast-path to using simpler drawables like
     *   ColorDrawable in the common cases
     */
    public val cssBackground: CSSBackgroundDrawable? = null,

    /** Background rendering Layer */
    background: BackgroundDrawable? = null,

    /** Border rendering Layer */
    border: BorderDrawable? = null,

    /** TouchableNativeFeeback set selection background, like "SelectableBackground" */
    feedbackUnderlay: Drawable? = null,

    /** Inset box-shadows */
    innerShadows: LayerDrawable? = null,

    /** Outline */
    outline: OutlineDrawable? = null,
) : LayerDrawable(emptyArray()) {
  public var outerShadows: LayerDrawable? = outerShadows
    private set

  public var background: BackgroundDrawable? = background
    private set

  public var border: BorderDrawable? = border
    private set

  public var feedbackUnderlay: Drawable? = feedbackUnderlay
    private set

  public var innerShadows: LayerDrawable? = innerShadows
    private set

  public var outline: OutlineDrawable? = outline
    private set

  // Holder value for currently set insets
  public var borderInsets: BorderInsets? = null

  // Holder value for currently set border radius
  public var borderRadius: BorderRadiusStyle? = null

  init {
    // We want to overlay drawables, instead of placing future drawables within the content area of
    // previous ones. E.g. an EditText style may set padding on a TextInput, but we don't want to
    // constrain background color to the area inside of the padding.
    setPaddingMode(LayerDrawable.PADDING_MODE_STACK)

    addLayer(originalBackground, ORIGINAL_BACKGROUND_ID)
    addLayer(outerShadows, OUTER_SHADOWS_ID)
    addLayer(cssBackground, CSS_BACKGROUND_ID)
    addLayer(background, BACKGROUND_ID)
    addLayer(border, BORDER_ID)
    addLayer(feedbackUnderlay, FEEDBACK_UNDERLAY_ID)
    addLayer(innerShadows, INNER_SHADOWS_ID)
    addLayer(outline, OUTLINE_ID)
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
            outline)
        .also { composite ->
          composite.borderInsets = this.borderInsets
          composite.borderRadius = this.borderRadius
        }
  }

  public fun withNewOuterShadow(outerShadows: LayerDrawable?): CompositeBackgroundDrawable =
      withNewLayer(outerShadows, OUTER_SHADOWS_ID, this::outerShadows::set)

  public fun withNewBackground(background: BackgroundDrawable?): CompositeBackgroundDrawable =
      withNewLayer(background, BACKGROUND_ID, this::background::set)

  public fun withNewBorder(border: BorderDrawable?): CompositeBackgroundDrawable =
      withNewLayer(border, BORDER_ID, this::border::set)

  public fun withNewFeedbackUnderlay(newUnderlay: Drawable?): CompositeBackgroundDrawable =
      withNewLayer(newUnderlay, FEEDBACK_UNDERLAY_ID, this::feedbackUnderlay::set)

  public fun withNewInnerShadow(innerShadows: LayerDrawable?): CompositeBackgroundDrawable =
      withNewLayer(innerShadows, INNER_SHADOWS_ID, this::innerShadows::set)

  public fun withNewOutline(outline: OutlineDrawable?): CompositeBackgroundDrawable =
      withNewLayer(outline, OUTLINE_ID, this::outline::set)

  /** @return true if the layer was updated, false if it was not */
  private fun updateLayer(layer: Drawable?, id: Int): Boolean {
    if (layer == null) {
      return findDrawableByLayerId(id) == null
    }

    if (findDrawableByLayerId(id) == null) {
      insertNewLayer(layer, id)
    } else {
      setDrawableByLayerId(id, layer)
    }
    invalidateSelf()
    return true
  }

  private fun insertNewLayer(layer: Drawable?, id: Int) {
    layer ?: return

    if (numberOfLayers == 0) {
      addLayer(layer, id)
      return
    }

    for (i in 0..<numberOfLayers) {
      if (id < getId(i)) {
        val tempDrawable: Drawable = getDrawable(i)
        val tempId = getId(i)
        setDrawable(i, layer)
        setId(i, id)
        insertNewLayer(tempDrawable, tempId)
        return
      } else if (i == numberOfLayers - 1) {
        addLayer(layer, id)
        return
      }
    }
  }

  private fun addLayer(layer: Drawable?, id: Int) {
    if (layer == null) {
      return
    }

    addLayer(layer)
    layer.callback = this
    setId(numberOfLayers - 1, id)
    invalidateSelf()
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

  private fun <T> withNewLayer(
      newLayer: T,
      id: Int,
      setNewLayer: (T) -> Unit,
  ): CompositeBackgroundDrawable where T : Drawable? {
    setNewLayer(newLayer)
    if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {
      if (updateLayer(newLayer, id)) {
        return this
      }
    }
    return CompositeBackgroundDrawable(
            context,
            originalBackground,
            outerShadows,
            cssBackground,
            background,
            border,
            feedbackUnderlay,
            innerShadows,
            outline)
        .also { composite ->
          composite.borderInsets = this.borderInsets
          composite.borderRadius = this.borderRadius
        }
  }

  private companion object {
    private const val ORIGINAL_BACKGROUND_ID: Int = 0
    private const val OUTER_SHADOWS_ID: Int = 1
    private const val CSS_BACKGROUND_ID: Int = 2
    private const val BACKGROUND_ID: Int = 3
    private const val BORDER_ID: Int = 4
    private const val FEEDBACK_UNDERLAY_ID: Int = 5
    private const val INNER_SHADOWS_ID: Int = 6
    private const val OUTLINE_ID: Int = 7
  }
}
