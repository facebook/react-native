/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.frescosupport

import android.content.res.Resources
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.drawable.Drawable
import android.net.Uri
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
 * <p>Since Fresco needs to callback to the TextView that contains this, in the ViewManager, you
 * must tell the Span about the TextView
 *
 * <p>Note: It borrows code from DynamicDrawableSpan and if that code updates how it computes size
 * or draws, we need to update this as well.
 */
public class FrescoBasedReactTextInlineImageSpan(
    resources: Resources,
    height: Int,
    width: Int,
    private val tintColor: Int,
    uri: Uri?,
    private val headers: ReadableMap?,
    private val draweeControllerBuilder: AbstractDraweeControllerBuilder<*, ImageRequest, *, *>,
    private val callerContext: Any?,
    private val resizeMode: String?
) : TextInlineImageSpan() {

    override var drawable: Drawable? = null
        private set

    private val draweeHolder: DraweeHolder<GenericDraweeHierarchy> =
        DraweeHolder(GenericDraweeHierarchyBuilder.newInstance(resources).build())

    private val _uri: Uri = uri ?: Uri.EMPTY
    private val _width: Int = PixelUtil.toPixelFromDIP(width.toDouble()).toInt()
    private val _height: Int = PixelUtil.toPixelFromDIP(height.toDouble()).toInt()

    private var textView: TextView? = null

    override val width: Int
        get() = _width

    override val height: Int
        get() = _height

    /**
     * The ReactTextView that holds this ImageSpan is responsible for passing these methods on so that
     * we can do proper lifetime management for Fresco
     */
    public override fun onDetachedFromWindow() {
        draweeHolder.onDetach()
    }

    public override fun onStartTemporaryDetach() {
        draweeHolder.onDetach()
    }

    public override fun onAttachedToWindow() {
        draweeHolder.onAttach()
    }

    public override fun onFinishTemporaryDetach() {
        draweeHolder.onAttach()
    }

    public override fun getSize(
        paint: Paint,
        text: CharSequence,
        start: Int,
        end: Int,
        fm: Paint.FontMetricsInt?
    ): Int {
        // NOTE: This getSize code is copied from DynamicDrawableSpan and modified to not use a Drawable

        fm?.let {
            it.ascent = -_height
            it.descent = 0

            it.top = it.ascent
            it.bottom = 0
        }

        return _width
    }

    public override fun setTextView(textView: TextView?) {
        this.textView = textView
    }

    public override fun draw(
        canvas: Canvas,
        text: CharSequence,
        start: Int,
        end: Int,
        x: Float,
        top: Int,
        y: Int,
        bottom: Int,
        paint: Paint
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

            drawable = draweeHolder.topLevelDrawable!!
            drawable!!.setBounds(0, 0, _width, _height)
            drawable!!.takeIf { tintColor != 0 }?.setColorFilter(tintColor, PorterDuff.Mode.SRC_IN)
            drawable!!.callback = this.textView
        }

        // NOTE: This drawing code is copied from DynamicDrawableSpan

        canvas.save()

        // Align to center
        val fontHeight = (paint.descent() - paint.ascent()).toInt()
        val centerY = y + paint.descent().toInt() - fontHeight / 2
        val transY = centerY - drawable!!.bounds.height() / 2

        canvas.translate(x, transY.toFloat())
        drawable!!.draw(canvas)
        canvas.restore()
    }
}
