/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.frescosupport

import android.content.Context
import android.net.Uri
import com.facebook.common.logging.FLog
import com.facebook.common.util.UriUtil
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder
import com.facebook.imagepipeline.request.ImageRequest
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.text.internal.ReactTextInlineImageShadowNode
import com.facebook.react.views.text.internal.span.TextInlineImageSpan
import com.facebook.yoga.YogaConstants
import java.util.Locale

/** Shadow node that represents an inline image. Loading is done using Fresco. */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
internal class FrescoBasedReactTextInlineImageShadowNode(
    private val draweeControllerBuilder: AbstractDraweeControllerBuilder<*, ImageRequest, *, *>,
    private val callerContext: Any?,
) : ReactTextInlineImageShadowNode() {

  private var uri: Uri? = null
  private var headers: ReadableMap? = null
  private var width = YogaConstants.UNDEFINED
  private var resizeMode: String? = null
  private var height = YogaConstants.UNDEFINED
  private var tintColor = 0

  @ReactProp(name = "src")
  fun setSource(sources: ReadableArray?) {
    val source =
        if (sources == null || sources.size() == 0 || sources.getType(0) != ReadableType.Map) null
        else checkNotNull(sources.getMap(0)).getString("uri")
    var tempUri: Uri? = null
    if (source != null) {
      try {
        tempUri = Uri.parse(source)
        // Verify scheme is set, so that relative uri (used by static resources) are not handled.
        if (tempUri.scheme == null) {
          tempUri = null
        }
      } catch (e: Exception) {
        // ignore malformed uri, then attempt to extract resource ID.
      }
      if (tempUri == null) {
        tempUri = getResourceDrawableUri(themedContext, source)
      }
    }
    if (tempUri != uri) {
      markUpdated()
    }
    uri = tempUri
  }

  @ReactProp(name = "headers")
  fun setHeaders(newHeaders: ReadableMap?) {
    headers = newHeaders
  }

  @ReactProp(name = "tintColor", customType = "Color")
  fun setTintColor(newTintColor: Int) {
    tintColor = newTintColor
  }

  /** Besides width/height, all other layout props on inline images are ignored */
  override fun setWidth(newWidth: Dynamic) {
    if (newWidth.type == ReadableType.Number) {
      width = newWidth.asDouble().toFloat()
    } else {
      FLog.w(ReactConstants.TAG, "Inline images must not have percentage based width")
      width = YogaConstants.UNDEFINED
    }
  }

  override fun setHeight(newHeight: Dynamic) {
    if (newHeight.type == ReadableType.Number) {
      height = newHeight.asDouble().toFloat()
    } else {
      FLog.w(ReactConstants.TAG, "Inline images must not have percentage based height")
      height = YogaConstants.UNDEFINED
    }
  }

  @ReactProp(name = ViewProps.RESIZE_MODE)
  fun setResizeMode(newResizeMode: String?) {
    resizeMode = newResizeMode
  }

  fun getUri(): Uri? = uri

  fun getHeaders(): ReadableMap? = headers

  override fun isVirtual(): Boolean = true

  override fun buildInlineImageSpan(): TextInlineImageSpan {
    val resources = themedContext.resources
    val finalWidth = Math.ceil(width.toDouble()).toInt()
    val finalHeight = Math.ceil(height.toDouble()).toInt()
    return FrescoBasedReactTextInlineImageSpan(
        resources,
        finalHeight,
        finalWidth,
        tintColor,
        getUri(),
        getHeaders(),
        getDraweeControllerBuilder(),
        getCallerContext(),
        resizeMode,
    )
  }

  fun getDraweeControllerBuilder() = draweeControllerBuilder

  fun getCallerContext(): Any? = callerContext

  // TODO: t9053573 is tracking that this code should be shared
  companion object {
    fun getResourceDrawableUri(context: Context, name: String?): Uri? {
      if (name == null || name.isEmpty()) {
        return null
      }
      val formattedName = name.lowercase(Locale.getDefault()).replace("-", "_")
      val resId = context.resources.getIdentifier(formattedName, "drawable", context.packageName)
      return Uri.Builder().scheme(UriUtil.LOCAL_RESOURCE_SCHEME).path(resId.toString()).build()
    }

    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "FrescoBasedReactTextInlineImageShadowNode",
          LegacyArchitectureLogLevel.ERROR,
      )
    }
  }
}
