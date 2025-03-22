/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image

import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.PixelFormat
import android.graphics.drawable.Animatable
import android.graphics.drawable.Drawable
import com.facebook.drawee.controller.ControllerListener
import com.facebook.drawee.drawable.ForwardingDrawable

internal open class ReactImageDownloadListener<INFO> :
    ForwardingDrawable(EmptyDrawable()), ControllerListener<INFO> {
  open fun onProgressChange(loaded: Int, total: Int) = Unit

  override fun onLevelChange(level: Int): Boolean {
    onProgressChange(level, MAX_LEVEL)
    return super.onLevelChange(level)
  }

  override fun onSubmit(id: String, callerContext: Any?) = Unit

  override fun onFinalImageSet(id: String, imageInfo: INFO?, animatable: Animatable?) = Unit

  override fun onIntermediateImageSet(id: String, imageInfo: INFO?) = Unit

  override fun onIntermediateImageFailed(id: String, throwable: Throwable) = Unit

  override fun onFailure(id: String, throwable: Throwable) = Unit

  override fun onRelease(id: String) = Unit

  /** A [Drawable] that renders nothing. */
  private class EmptyDrawable : Drawable() {
    override fun draw(canvas: Canvas) = Unit

    override fun setAlpha(alpha: Int) = Unit

    override fun setColorFilter(colorFilter: ColorFilter?) = Unit

    override fun getOpacity(): Int = PixelFormat.OPAQUE
  }

  companion object {
    private const val MAX_LEVEL = 10000
  }
}
