/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.frescosupport

import android.content.res.Resources
import android.graphics.BlendMode
import android.graphics.BlendModeColorFilter
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.widget.TextView
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder
import com.facebook.drawee.generic.GenericDraweeHierarchy
import com.facebook.drawee.generic.GenericDraweeHierarchyBuilder
import com.facebook.drawee.view.DraweeHolder
import com.facebook.imagepipeline.request.ImageRequest
import com.facebook.imagepipeline.request.ImageRequestBuilder
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.fresco.ReactNetworkImageRequest
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.image.ImageResizeMode
import com.facebook.react.views.text.internal.span.TextInlineImageSpan

/**
 * FrescoBasedTextInlineImageSpan is a span for Images that are inside <Text/>. It computes its size
 * based on the input size. When it is time to draw, it will use the Fresco framework to get the
 * right Drawable and let that draw.
 *
 * Since Fresco needs to callback to the TextView that contains this, in the ViewManager, you must
 * tell the Span about the TextView
 *
 * Note: It borrows code from DynamicDrawableSpan and if that code updates how it computes size or
 * draws, we need to update this as well.
 */
internal class FrescoBasedReactTextInlineImageSpan(
    resources: Resources,
    height: Int,
    width: Int,
    private val tintColor: Int,
    uri: Uri?,
    private val headers: ReadableMap?,
    private val draweeControllerBuilder: AbstractDraweeControllerBuilder<*, ImageRequest, *, *>,
    private val callerContext: Any?,
    private val resizeMode: String?,
) : TextInlineImageSpan() {

  private var textView: TextView? = null
  private val _uri: Uri = uri ?: Uri.EMPTY
  private val _width: Int = PixelUtil.toPixelFromDIP(width.toDouble()).toInt()
  private val _height: Int = PixelUtil.toPixelFromDIP(height.toDouble()).toInt()
  private val draweeHolder: DraweeHolder<GenericDraweeHierarchy> =
      DraweeHolder(GenericDraweeHierarchyBuilder.newInstance(resources).build())

  override val width: Int
    get() = _width

  override val height: Int
    get() = _height

  override var drawable: Drawable? = null
    private set

  /**
   * The ReactTextView that holds this ImageSpan is responsible for passing these methods on so that
   * we can do proper lifetime management for Fresco
   */
  override fun onDetachedFromWindow() {
    draweeHolder.onDetach()
  }

  override fun onStartTemporaryDetach() {
    draweeHolder.onDetach()
  }

  override fun onAttachedToWindow() {
    draweeHolder.onAttach()
  }

  override fun onFinishTemporaryDetach() {
    draweeHolder.onAttach()
  }

  override fun getSize(
      paint: Paint,
      text: CharSequence,
      start: Int,
      end: Int,
      fm: Paint.FontMetricsInt?,
  ): Int {
    // NOTE: This getSize code is copied from DynamicDrawableSpan and modified
    // to not use a Drawable

    fm?.let { fm ->
      fm.ascent = -_height
      fm.descent = 0

      fm.top = fm.ascent
      fm.bottom = 0
    }

    return _width
  }

  override fun setTextView(textView: TextView?) {
    this.textView = textView
  }

  override fun draw(
      canvas: Canvas,
      text: CharSequence,
      start: Int,
      end: Int,
      x: Float,
      top: Int,
      y: Int,
      bottom: Int,
      paint: Paint,
  ) {
    if (drawable == null) {
      val imageRequestBuilder = ImageRequestBuilder.newBuilderWithSource(_uri)
      val imageRequest: ImageRequest =
          ReactNetworkImageRequest.fromBuilderWithHeaders(imageRequestBuilder, headers)

      draweeHolder.hierarchy.setActualImageScaleType(ImageResizeMode.toScaleType(resizeMode))

      draweeControllerBuilder.reset()
      draweeControllerBuilder.oldController = draweeHolder.controller

      callerContext?.let { draweeControllerBuilder.setCallerContext(it) }

      draweeControllerBuilder.setImageRequest(imageRequest)

      val draweeController = draweeControllerBuilder.build()
      draweeHolder.controller = draweeController
      draweeControllerBuilder.reset()

      checkNotNull(draweeHolder.topLevelDrawable).apply {
        setBounds(0, 0, _width, _height)
        if (tintColor != 0) {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            colorFilter = BlendModeColorFilter(tintColor, BlendMode.SRC_IN)
          } else {
            colorFilter = PorterDuffColorFilter(tintColor, PorterDuff.Mode.SRC_IN)
          }
        }
        callback = textView
        drawable = this
      }
    }

    // NOTE: This drawing code is copied from DynamicDrawableSpan

    canvas.save()

    // Align to center
    val _drawable = checkNotNull(drawable)
    val fontHeight = (paint.descent() - paint.ascent()).toInt()
    val centerY = y + paint.descent().toInt() - fontHeight / 2
    val transY = centerY - _drawable.bounds.height() / 2

    canvas.translate(x, transY.toFloat())
    _drawable.draw(canvas)
    canvas.restore()
  }
}
