/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Path
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.drawable.Drawable
import android.os.Build
import android.view.View
import android.widget.ImageView
import androidx.annotation.ColorInt
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.drawable.BackgroundDrawable
import com.facebook.react.uimanager.drawable.BorderDrawable
import com.facebook.react.uimanager.drawable.CSSBackgroundDrawable
import com.facebook.react.uimanager.drawable.CompositeBackgroundDrawable
import com.facebook.react.uimanager.drawable.InsetBoxShadowDrawable
import com.facebook.react.uimanager.drawable.MIN_INSET_BOX_SHADOW_SDK_VERSION
import com.facebook.react.uimanager.drawable.MIN_OUTSET_BOX_SHADOW_SDK_VERSION
import com.facebook.react.uimanager.drawable.OutlineDrawable
import com.facebook.react.uimanager.drawable.OutsetBoxShadowDrawable
import com.facebook.react.uimanager.style.BackgroundImageLayer
import com.facebook.react.uimanager.style.BorderInsets
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.BoxShadow
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.uimanager.style.OutlineStyle

/**
 * BackgroundStyleApplicator is responsible for applying backgrounds, borders, and related effects,
 * to an Android view
 */
@OptIn(UnstableReactNativeAPI::class)
public object BackgroundStyleApplicator {

  @JvmStatic
  public fun setBackgroundColor(view: View, @ColorInt color: Int?): Unit {
    // No color to set, and no color already set
    if ((color == null || color == Color.TRANSPARENT) &&
        view.background !is CompositeBackgroundDrawable) {
      return
    }

    if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {
      ensureBackgroundDrawable(view).backgroundColor = color ?: Color.TRANSPARENT
    } else {
      ensureCSSBackground(view).color = color ?: Color.TRANSPARENT
    }
  }

  @JvmStatic
  public fun setBackgroundImage(
      view: View,
      backgroundImageLayers: List<BackgroundImageLayer>?
  ): Unit {
    if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {
      ensureBackgroundDrawable(view).backgroundImageLayers = backgroundImageLayers
    } else {
      ensureCSSBackground(view).setBackgroundImage(backgroundImageLayers)
    }
  }

  @JvmStatic
  @ColorInt
  public fun getBackgroundColor(view: View): Int? {
    return if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {
      getBackground(view)?.backgroundColor
    } else {
      getCSSBackground(view)?.color
    }
  }

  @JvmStatic
  public fun setBorderWidth(view: View, edge: LogicalEdge, width: Float?): Unit {
    val composite = ensureCompositeBackgroundDrawable(view)
    composite.borderInsets = composite.borderInsets ?: BorderInsets()
    composite.borderInsets?.setBorderWidth(edge, width)

    if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {
      ensureBorderDrawable(view).setBorderWidth(edge.toSpacingType(), width?.dpToPx() ?: Float.NaN)
      composite.background?.borderInsets = composite.borderInsets
      composite.border?.borderInsets = composite.borderInsets

      composite.background?.invalidateSelf()
      composite.border?.invalidateSelf()
    } else {
      ensureCSSBackground(view).setBorderWidth(edge.toSpacingType(), width?.dpToPx() ?: Float.NaN)
    }

    composite.borderInsets = composite.borderInsets ?: BorderInsets()
    composite.borderInsets?.setBorderWidth(edge, width)

    if (Build.VERSION.SDK_INT >= MIN_INSET_BOX_SHADOW_SDK_VERSION) {
      for (shadow in composite.innerShadows.filterIsInstance<InsetBoxShadowDrawable>()) {
        shadow.borderInsets = composite.borderInsets
      }
    }
  }

  @JvmStatic
  public fun getBorderWidth(view: View, edge: LogicalEdge): Float? {
    return if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {
      val width = getBorder(view)?.borderWidth?.getRaw(edge.toSpacingType())
      if (width == null || width.isNaN()) null else width.pxToDp()
    } else {
      val width = getCSSBackground(view)?.getBorderWidth(edge.toSpacingType())
      if (width == null || width.isNaN()) null else width.pxToDp()
    }
  }

  @JvmStatic
  public fun setBorderColor(view: View, edge: LogicalEdge, @ColorInt color: Int?): Unit {
    if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {
      ensureBorderDrawable(view).setBorderColor(edge, color)
    } else {
      ensureCSSBackground(view).setBorderColor(edge.toSpacingType(), color)
    }
  }

  @JvmStatic
  @ColorInt
  public fun getBorderColor(view: View, edge: LogicalEdge): Int? {
    return if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {
      getBorder(view)?.getBorderColor(edge)
    } else {
      getCSSBackground(view)?.getBorderColor(edge.toSpacingType())
    }
  }

  @JvmStatic
  public fun setBorderRadius(
      view: View,
      corner: BorderRadiusProp,
      radius: LengthPercentage?
  ): Unit {
    val compositeBackgroundDrawable = ensureCompositeBackgroundDrawable(view)
    compositeBackgroundDrawable.borderRadius =
        compositeBackgroundDrawable.borderRadius ?: BorderRadiusStyle()
    compositeBackgroundDrawable.borderRadius?.set(corner, radius)

    if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {
      if (view is ImageView) {
        ensureBackgroundDrawable(view)
      }
      compositeBackgroundDrawable.background?.borderRadius =
          compositeBackgroundDrawable.borderRadius
      compositeBackgroundDrawable.border?.borderRadius = compositeBackgroundDrawable.borderRadius

      compositeBackgroundDrawable.background?.invalidateSelf()
      compositeBackgroundDrawable.border?.invalidateSelf()
    } else {
      ensureCSSBackground(view).setBorderRadius(corner, radius)
    }

    if (Build.VERSION.SDK_INT >= MIN_OUTSET_BOX_SHADOW_SDK_VERSION) {
      for (shadow in
          compositeBackgroundDrawable.outerShadows.filterIsInstance<OutsetBoxShadowDrawable>()) {
        shadow.borderRadius = compositeBackgroundDrawable.borderRadius
      }
    }

    if (Build.VERSION.SDK_INT >= MIN_INSET_BOX_SHADOW_SDK_VERSION) {
      for (shadow in
          compositeBackgroundDrawable.innerShadows.filterIsInstance<InsetBoxShadowDrawable>()) {
        shadow.borderRadius = compositeBackgroundDrawable.borderRadius
      }
    }

    compositeBackgroundDrawable.outline?.borderRadius = compositeBackgroundDrawable.borderRadius
    compositeBackgroundDrawable.invalidateSelf()
  }

  @JvmStatic
  public fun getBorderRadius(view: View, corner: BorderRadiusProp): LengthPercentage? {

    return if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {
      getCompositeBackgroundDrawable(view)?.borderRadius?.get(corner)
    } else {
      getCSSBackground(view)?.borderRadius?.get(corner)
    }
  }

  @JvmStatic
  public fun setBorderStyle(view: View, borderStyle: BorderStyle?): Unit {
    if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {
      ensureBorderDrawable(view).borderStyle = borderStyle
    } else {
      ensureCSSBackground(view).borderStyle = borderStyle
    }
  }

  @JvmStatic
  public fun getBorderStyle(view: View): BorderStyle? {
    return if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {
      getBorder(view)?.borderStyle
    } else {
      getCSSBackground(view)?.borderStyle
    }
  }

  @JvmStatic
  public fun setOutlineColor(view: View, @ColorInt outlineColor: Int?): Unit {
    if (ViewUtil.getUIManagerType(view) != UIManagerType.FABRIC) {
      return
    }

    val outline = ensureOutlineDrawable(view)
    if (outlineColor != null) {
      outline.outlineColor = outlineColor
    }
  }

  @JvmStatic public fun getOutlineColor(view: View): Int? = getOutlineDrawable(view)?.outlineColor

  @JvmStatic
  public fun setOutlineOffset(view: View, outlineOffset: Float): Unit {
    if (ViewUtil.getUIManagerType(view) != UIManagerType.FABRIC) {
      return
    }

    val outline = ensureOutlineDrawable(view)
    outline.outlineOffset = outlineOffset.dpToPx()
  }

  public fun getOutlineOffset(view: View): Float? = getOutlineDrawable(view)?.outlineOffset

  @JvmStatic
  public fun setOutlineStyle(view: View, outlineStyle: OutlineStyle?): Unit {
    if (ViewUtil.getUIManagerType(view) != UIManagerType.FABRIC) {
      return
    }

    val outline = ensureOutlineDrawable(view)
    if (outlineStyle != null) {
      outline.outlineStyle = outlineStyle
    }
  }

  public fun getOutlineStyle(view: View): OutlineStyle? = getOutlineDrawable(view)?.outlineStyle

  @JvmStatic
  public fun setOutlineWidth(view: View, width: Float): Unit {
    if (ViewUtil.getUIManagerType(view) != UIManagerType.FABRIC) {
      return
    }

    val outline = ensureOutlineDrawable(view)
    outline.outlineWidth = width.dpToPx()
  }

  public fun getOutlineWidth(view: View): Float? = getOutlineDrawable(view)?.outlineOffset

  @JvmStatic
  public fun setBoxShadow(view: View, shadows: List<BoxShadow>): Unit {
    if (ViewUtil.getUIManagerType(view) != UIManagerType.FABRIC) {
      return
    }

    var innerShadows = mutableListOf<InsetBoxShadowDrawable>()
    var outerShadows = mutableListOf<OutsetBoxShadowDrawable>()

    val compositeBackgroundDrawable = ensureCompositeBackgroundDrawable(view)
    val borderInsets = compositeBackgroundDrawable.borderInsets
    val borderRadius = compositeBackgroundDrawable.borderRadius

    /**
     * z-ordering of user-provided shadow-list is opposite direction of LayerDrawable z-ordering
     * https://drafts.csswg.org/css-backgrounds/#shadow-layers
     */
    for (boxShadow in shadows) {
      val offsetX = boxShadow.offsetX
      val offsetY = boxShadow.offsetY
      val color = boxShadow.color ?: Color.BLACK
      val blurRadius = boxShadow.blurRadius ?: 0f
      val spreadDistance = boxShadow.spreadDistance ?: 0f
      val inset = boxShadow.inset ?: false

      if (inset && Build.VERSION.SDK_INT >= MIN_INSET_BOX_SHADOW_SDK_VERSION) {
        innerShadows.add(
            InsetBoxShadowDrawable(
                context = view.context,
                borderRadius = borderRadius,
                borderInsets = borderInsets,
                shadowColor = color,
                offsetX = offsetX,
                offsetY = offsetY,
                blurRadius = blurRadius,
                spread = spreadDistance))
      } else if (!inset && Build.VERSION.SDK_INT >= MIN_OUTSET_BOX_SHADOW_SDK_VERSION) {
        outerShadows.add(
            OutsetBoxShadowDrawable(
                context = view.context,
                borderRadius = borderRadius,
                shadowColor = color,
                offsetX = offsetX,
                offsetY = offsetY,
                blurRadius = blurRadius,
                spread = spreadDistance))
      }
    }

    view.background =
        ensureCompositeBackgroundDrawable(view)
            .withNewShadows(outerShadows = outerShadows, innerShadows = innerShadows)
  }

  @JvmStatic
  public fun setBoxShadow(view: View, shadows: ReadableArray?): Unit {
    if (shadows == null) {
      BackgroundStyleApplicator.setBoxShadow(view, emptyList())
      return
    }

    val shadowStyles = mutableListOf<BoxShadow>()
    for (i in 0..<shadows.size()) {
      shadowStyles.add(checkNotNull(BoxShadow.parse(shadows.getMap(i), view.context)))
    }
    BackgroundStyleApplicator.setBoxShadow(view, shadowStyles)
  }

  @JvmStatic
  public fun setFeedbackUnderlay(view: View, drawable: Drawable?): Unit {
    if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {

      ensureCompositeBackgroundDrawable(view).withNewFeedbackUnderlay(drawable)
    } else {
      view.background = ensureCompositeBackgroundDrawable(view).withNewFeedbackUnderlay(drawable)
    }
  }

  @JvmStatic
  public fun clipToPaddingBox(view: View, canvas: Canvas): Unit {
    if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {
      val drawingRect = Rect()
      view.getDrawingRect(drawingRect)

      val composite = getCompositeBackgroundDrawable(view)
      if (composite == null) {
        canvas.clipRect(drawingRect)
        return
      }

      val paddingBoxRect = RectF()

      val computedBorderInsets =
          composite.borderInsets?.resolve(composite.layoutDirection, view.context)

      paddingBoxRect.left = composite.bounds.left + (computedBorderInsets?.left?.dpToPx() ?: 0f)
      paddingBoxRect.top = composite.bounds.top + (computedBorderInsets?.top?.dpToPx() ?: 0f)
      paddingBoxRect.right = composite.bounds.right - (computedBorderInsets?.right?.dpToPx() ?: 0f)
      paddingBoxRect.bottom =
          composite.bounds.bottom - (computedBorderInsets?.bottom?.dpToPx() ?: 0f)

      if (composite.borderRadius?.hasRoundedBorders() == true) {
        val paddingBoxPath =
            createPaddingBoxPath(
                view,
                composite,
                paddingBoxRect,
                computedBorderInsets,
            )

        paddingBoxPath.offset(drawingRect.left.toFloat(), drawingRect.top.toFloat())
        canvas.clipPath(paddingBoxPath)
      } else {
        paddingBoxRect.offset(drawingRect.left.toFloat(), drawingRect.top.toFloat())
        canvas.clipRect(paddingBoxRect)
      }
    } else {
      val drawingRect = Rect()
      view.getDrawingRect(drawingRect)

      val cssBackground = getCSSBackground(view)
      if (cssBackground == null) {
        canvas.clipRect(drawingRect)
        return
      }

      val paddingBoxPath = cssBackground.paddingBoxPath
      if (paddingBoxPath != null) {
        paddingBoxPath.offset(drawingRect.left.toFloat(), drawingRect.top.toFloat())
        canvas.clipPath(paddingBoxPath)
      } else {
        val paddingBoxRect = cssBackground.paddingBoxRect
        paddingBoxRect.offset(drawingRect.left.toFloat(), drawingRect.top.toFloat())
        canvas.clipRect(paddingBoxRect)
      }
    }
  }

  @JvmStatic
  public fun reset(view: View): Unit {
    if (view.background is CompositeBackgroundDrawable) {
      view.background = (view.background as CompositeBackgroundDrawable).originalBackground
    }
  }

  private fun ensureCompositeBackgroundDrawable(view: View): CompositeBackgroundDrawable {
    if (view.background is CompositeBackgroundDrawable) {
      return view.background as CompositeBackgroundDrawable
    }

    val compositeDrawable =
        CompositeBackgroundDrawable(context = view.context, originalBackground = view.background)
    view.background = compositeDrawable
    return compositeDrawable
  }

  private fun getCompositeBackgroundDrawable(view: View): CompositeBackgroundDrawable? =
      view.background as? CompositeBackgroundDrawable

  private fun ensureCSSBackground(view: View): CSSBackgroundDrawable {
    val compositeBackgroundDrawable = ensureCompositeBackgroundDrawable(view)
    var cssBackground = compositeBackgroundDrawable.cssBackground

    return if (cssBackground != null) {
      return cssBackground
    } else {
      cssBackground = CSSBackgroundDrawable(view.context)
      view.background = compositeBackgroundDrawable.withNewCssBackground(cssBackground)
      cssBackground
    }
  }

  private fun ensureBackgroundDrawable(view: View): BackgroundDrawable {
    val compositeBackgroundDrawable = ensureCompositeBackgroundDrawable(view)
    var background = compositeBackgroundDrawable.background

    return if (background != null) {
      background
    } else {
      background =
          BackgroundDrawable(
              view.context,
              compositeBackgroundDrawable.borderRadius,
              compositeBackgroundDrawable.borderInsets)
      view.background = compositeBackgroundDrawable.withNewBackground(background)
      background
    }
  }

  private fun getCSSBackground(view: View): CSSBackgroundDrawable? =
      getCompositeBackgroundDrawable(view)?.cssBackground

  private fun getBackground(view: View): BackgroundDrawable? =
      getCompositeBackgroundDrawable(view)?.background

  private fun getBorder(view: View): BorderDrawable? = getCompositeBackgroundDrawable(view)?.border

  private fun ensureBorderDrawable(view: View): BorderDrawable {
    val compositeBackgroundDrawable = ensureCompositeBackgroundDrawable(view)
    var border = compositeBackgroundDrawable.border
    if (border == null) {
      border =
          BorderDrawable(
              context = view.context,
              borderRadius = compositeBackgroundDrawable.borderRadius,
              borderWidth = Spacing(0f),
              borderStyle = BorderStyle.SOLID,
              borderInsets = compositeBackgroundDrawable.borderInsets,
          )
      view.background = compositeBackgroundDrawable.withNewBorder(border)
    }

    return border
  }

  private fun ensureOutlineDrawable(view: View): OutlineDrawable {
    val compositeBackgroundDrawable = ensureCompositeBackgroundDrawable(view)
    var outline = compositeBackgroundDrawable.outline
    if (outline == null) {
      val borderRadius =
          if (ReactNativeFeatureFlags.enableNewBackgroundAndBorderDrawables()) {
            compositeBackgroundDrawable.borderRadius
          } else {
            ensureCSSBackground(view).borderRadius
          }

      outline =
          OutlineDrawable(
              context = view.context,
              borderRadius = borderRadius,
              outlineColor = Color.BLACK,
              outlineOffset = 0f,
              outlineStyle = OutlineStyle.SOLID,
              outlineWidth = 0f,
          )

      view.background = compositeBackgroundDrawable.withNewOutline(outline)
    }

    return outline
  }

  private fun getOutlineDrawable(view: View): OutlineDrawable? =
      getCompositeBackgroundDrawable(view)?.outline

  /**
   * Here, "inner" refers to the border radius on the inside of the border. So it ends up being the
   * "outer" border radius inset by the respective width.
   */
  private fun getInnerBorderRadius(computedRadius: Float?, borderWidth: Float?): Float {
    return ((computedRadius ?: 0f) - (borderWidth ?: 0f)).coerceAtLeast(0f)
  }

  private fun createPaddingBoxPath(
      view: View,
      composite: CompositeBackgroundDrawable,
      paddingBoxRect: RectF,
      computedBorderInsets: RectF?
  ): Path {
    val computedBorderRadius =
        composite.borderRadius?.resolve(
            composite.layoutDirection,
            view.context,
            PixelUtil.toDIPFromPixel(composite.bounds.width().toFloat()),
            PixelUtil.toDIPFromPixel(composite.bounds.height().toFloat()),
        )

    val paddingBoxPath = Path()

    val innerTopLeftRadiusX =
        getInnerBorderRadius(
            computedBorderRadius?.topLeft?.horizontal?.dpToPx(),
            computedBorderInsets?.left?.dpToPx())
    val innerTopLeftRadiusY =
        getInnerBorderRadius(
            computedBorderRadius?.topLeft?.vertical?.dpToPx(), computedBorderInsets?.top?.dpToPx())
    val innerTopRightRadiusX =
        getInnerBorderRadius(
            computedBorderRadius?.topRight?.horizontal?.dpToPx(),
            computedBorderInsets?.right?.dpToPx())
    val innerTopRightRadiusY =
        getInnerBorderRadius(
            computedBorderRadius?.topRight?.vertical?.dpToPx(), computedBorderInsets?.top?.dpToPx())
    val innerBottomRightRadiusX =
        getInnerBorderRadius(
            computedBorderRadius?.bottomRight?.horizontal?.dpToPx(),
            computedBorderInsets?.right?.dpToPx())
    val innerBottomRightRadiusY =
        getInnerBorderRadius(
            computedBorderRadius?.bottomRight?.vertical?.dpToPx(),
            computedBorderInsets?.bottom?.dpToPx())
    val innerBottomLeftRadiusX =
        getInnerBorderRadius(
            computedBorderRadius?.bottomLeft?.horizontal?.dpToPx(),
            computedBorderInsets?.left?.dpToPx())
    val innerBottomLeftRadiusY =
        getInnerBorderRadius(
            computedBorderRadius?.bottomLeft?.vertical?.dpToPx(),
            computedBorderInsets?.bottom?.dpToPx())

    paddingBoxPath.addRoundRect(
        paddingBoxRect,
        floatArrayOf(
            innerTopLeftRadiusX,
            innerTopLeftRadiusY,
            innerTopRightRadiusX,
            innerTopRightRadiusY,
            innerBottomRightRadiusX,
            innerBottomRightRadiusY,
            innerBottomLeftRadiusX,
            innerBottomLeftRadiusY,
        ),
        Path.Direction.CW)
    return paddingBoxPath
  }
}
