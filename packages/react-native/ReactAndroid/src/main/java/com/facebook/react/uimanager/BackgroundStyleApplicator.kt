/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Rect
import android.view.View
import androidx.annotation.ColorInt
import androidx.annotation.RequiresApi
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.uimanager.drawable.CSSBackgroundDrawable
import com.facebook.react.uimanager.drawable.CompositeBackgroundDrawable
import com.facebook.react.uimanager.drawable.InsetBoxShadowDrawable
import com.facebook.react.uimanager.drawable.OutsetBoxShadowDrawable
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.BoxShadow
import com.facebook.react.uimanager.style.LogicalEdge

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

    ensureCSSBackground(view).color = color ?: Color.TRANSPARENT
  }

  @JvmStatic
  @ColorInt
  public fun getBackgroundColor(view: View): Int? = getCSSBackground(view)?.color

  @JvmStatic
  public fun setBorderWidth(view: View, edge: LogicalEdge, width: Float?): Unit =
      ensureCSSBackground(view)
          .setBorderWidth(edge.toSpacingType(), PixelUtil.toPixelFromDIP(width ?: Float.NaN))

  @JvmStatic
  public fun getBorderWidth(view: View, edge: LogicalEdge): Float? {
    val width = getCSSBackground(view)?.getBorderWidth(edge.toSpacingType())
    return if (width == null || width.isNaN()) null else PixelUtil.toDIPFromPixel((width))
  }

  @JvmStatic
  public fun setBorderColor(view: View, edge: LogicalEdge, @ColorInt color: Int?): Unit =
      ensureCSSBackground(view).setBorderColor(edge.toSpacingType(), color)

  @JvmStatic
  @ColorInt
  public fun getBorderColor(view: View, edge: LogicalEdge): Int? =
      getCSSBackground(view)?.getBorderColor(edge.toSpacingType())

  @JvmStatic
  public fun setBorderRadius(
      view: View,
      corner: BorderRadiusProp,
      // TODO: LengthPercentage silently converts from pixels to DIPs before here already
      radius: LengthPercentage?
  ): Unit = ensureCSSBackground(view).setBorderRadius(corner, radius)

  @JvmStatic
  public fun getBorderRadius(view: View, corner: BorderRadiusProp): LengthPercentage? =
      getCSSBackground(view)?.borderRadius?.get(corner)

  @JvmStatic
  public fun setBorderStyle(view: View, borderStyle: BorderStyle?): Unit {
    ensureCSSBackground(view).borderStyle = borderStyle
  }

  @JvmStatic
  public fun getBorderStyle(view: View): BorderStyle? = getCSSBackground(view)?.borderStyle

  @JvmStatic
  @RequiresApi(31)
  public fun setShadows(view: View, shadows: List<BoxShadow>): Unit {
    val shadowDrawables =
        shadows.map { boxShadow ->
          val offsetX = boxShadow.offsetX
          val offsetY = boxShadow.offsetY
          val color = boxShadow.color ?: Color.TRANSPARENT
          val blurRadius = boxShadow.blurRadius ?: 0f
          val spreadRadius = boxShadow.spreadRadius ?: 0f
          val inset = boxShadow.inset ?: false

          if (inset)
              InsetBoxShadowDrawable(
                  view.context,
                  ensureCSSBackground(view),
                  color,
                  offsetX,
                  offsetY,
                  blurRadius,
                  spreadRadius)
          else
              OutsetBoxShadowDrawable(
                  view.context,
                  ensureCSSBackground(view),
                  color,
                  offsetX,
                  offsetY,
                  blurRadius,
                  spreadRadius)
        }

    updateCompositeDrawable(
        view,
        ensureCompositeBackgroundDrawable(view).withNewShadows(shadowDrawables.toTypedArray()))
  }

  @JvmStatic
  public fun clipToPaddingBox(view: View, canvas: Canvas): Unit {
    // The canvas may be scrolled, so we need to offset
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

  private fun updateCompositeDrawable(
      view: View,
      compositeDrawable: CompositeBackgroundDrawable
  ): Unit {
    view.background = null
    view.background = compositeDrawable
    view.invalidate()
  }

  private fun ensureCompositeBackgroundDrawable(view: View): CompositeBackgroundDrawable {
    if (view.background is CompositeBackgroundDrawable) {
      return view.background as CompositeBackgroundDrawable
    }

    val compositeDrawable = CompositeBackgroundDrawable(view.background, null, emptyArray(), null)
    updateCompositeDrawable(view, compositeDrawable)
    return compositeDrawable
  }

  private fun ensureCSSBackground(view: View): CSSBackgroundDrawable {
    val compositeBackgroundDrawable = ensureCompositeBackgroundDrawable(view)
    if (compositeBackgroundDrawable.cssBackground != null) {
      return compositeBackgroundDrawable.cssBackground
    } else {
      val cssBackground = CSSBackgroundDrawable(view.context)
      updateCompositeDrawable(view, compositeBackgroundDrawable.withNewCssBackground(cssBackground))
      return cssBackground
    }
  }

  private fun getCSSBackground(view: View): CSSBackgroundDrawable? {
    if (view.background is CompositeBackgroundDrawable) {
      return (view.background as CompositeBackgroundDrawable).cssBackground
    }
    return null
  }
}
