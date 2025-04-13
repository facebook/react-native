/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 package com.facebook.react.views.text.frescosupport

 import android.content.Context
 import android.content.res.Resources
 import android.net.Uri
 import androidx.core.util.Preconditions
 import com.facebook.common.logging.FLog
 import com.facebook.common.util.UriUtil
 import com.facebook.drawee.controller.AbstractDraweeControllerBuilder
 import com.facebook.infer.annotation.Nullsafe
 import com.facebook.react.bridge.Dynamic
 import com.facebook.react.bridge.ReadableArray
 import com.facebook.react.bridge.ReadableMap
 import com.facebook.react.bridge.ReadableType
 import com.facebook.react.common.ReactConstants
 import com.facebook.react.common.annotations.internal.LegacyArchitecture
 import com.facebook.react.uimanager.ViewProps
 import com.facebook.react.uimanager.annotations.ReactProp
 import com.facebook.react.views.text.internal.ReactTextInlineImageShadowNode
 import com.facebook.react.views.text.internal.span.TextInlineImageSpan
 import com.facebook.yoga.YogaConstants
 import java.util.Locale
 
 @Nullsafe(Nullsafe.Mode.LOCAL)
 @LegacyArchitecture
 class FrescoBasedReactTextInlineImageShadowNode(
     private val draweeControllerBuilder: AbstractDraweeControllerBuilder,
     private val callerContext: Any?
 ) : ReactTextInlineImageShadowNode() {
 
     private var uri: Uri? = null
     private var headers: ReadableMap? = null
     private var width: Float = YogaConstants.UNDEFINED
     private var height: Float = YogaConstants.UNDEFINED
     private var resizeMode: String? = null
     private var tintColor: Int = 0
 
     @ReactProp(name = "src")
     fun setSource(sources: ReadableArray?) {
         val source =
             if (sources == null || sources.size() == 0 || sources.getType(0) != ReadableType.Map) {
                 null
             } else {
                 Preconditions.checkNotNull(sources.getMap(0)).getString("uri")
             }
 
         var parsedUri: Uri? = null
         if (source != null) {
             try {
                 parsedUri = Uri.parse(source)
                 // Verify scheme is set, so that relative uri (used by static resources) are not
                 // handled.
                 if (parsedUri.scheme == null) {
                     parsedUri = null
                 }
             } catch (e: Exception) {
                 // ignore malformed uri, then attempt to extract resource ID.
 
             }
 
             if (parsedUri == null) {
                 parsedUri = getResourceDrawableUri(themedContext, source)
             }
         }
 
         if (parsedUri != uri) {
             markUpdated()
         }
         uri = parsedUri
     }
 
     @ReactProp(name = "headers")
     fun setHeaders(headers: ReadableMap?) {
         this.headers = headers
     }
 
     @ReactProp(name = "tintColor", customType = "Color")
     fun setTintColor(tintColor: Int) {
         this.tintColor = tintColor
     }
     /** Besides width/height, all other layout props on inline images are ignored */
     override fun setWidth(width: Dynamic) {
         this.width =
             if (width.type == ReadableType.Number) {
                 width.asDouble().toFloat()
             } else {
                 FLog.w(ReactConstants.TAG, "Inline images must not have percentage based width")
                 YogaConstants.UNDEFINED
             }
     }
 
     override fun setHeight(height: Dynamic) {
         this.height =
             if (height.type == ReadableType.Number) {
                 height.asDouble().toFloat()
             } else {
                 FLog.w(ReactConstants.TAG, "Inline images must not have percentage based height")
                 YogaConstants.UNDEFINED
             }
     }
 
     @ReactProp(name = ViewProps.RESIZE_MODE)
     fun setResizeMode(resizeMode: String?) {
         this.resizeMode = resizeMode
     }
 
     fun getUri(): Uri? = uri
 
     fun getHeaders(): ReadableMap? = headers
 
     private fun getResourceDrawableUri(context: Context, name: String?): Uri? {
         if (name.isNullOrEmpty()) return null
         val resourceName = name.lowercase(Locale.getDefault()).replace("-", "_")
         val resId = context.resources.getIdentifier(resourceName, "drawable", context.packageName)
         return Uri.Builder().scheme(UriUtil.LOCAL_RESOURCE_SCHEME).path(resId.toString()).build()
     }
 
     override fun isVirtual(): Boolean = true
 
     override fun buildInlineImageSpan(): TextInlineImageSpan {
         val resources: Resources = themedContext.resources
         val imageWidth = Math.ceil(width.toDouble()).toInt()
         val imageHeight = Math.ceil(height.toDouble()).toInt()
 
         return FrescoBasedReactTextInlineImageSpan(
             resources,
             imageHeight,
             imageWidth,
             tintColor,
             uri,
             headers,
             draweeControllerBuilder,
             callerContext,
             resizeMode
         )
     }
 
     fun getDraweeControllerBuilder(): AbstractDraweeControllerBuilder = draweeControllerBuilder
 
     fun getCallerContext(): Any? = callerContext
 }
 