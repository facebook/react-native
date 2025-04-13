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
 import androidx.annotation.Nullable
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
 
 /** Shadow node that represents an inline image. Loading is done using Fresco. */
 @Nullsafe(Nullsafe.Mode.LOCAL)
 @LegacyArchitecture
 internal class FrescoBasedReactTextInlineImageShadowNode(
     private val mDraweeControllerBuilder: AbstractDraweeControllerBuilder<*, *, *, *>,
     @Nullable private val mCallerContext: Any?
 ) : ReactTextInlineImageShadowNode() {
 
     @Nullable private var mUri: Uri? = null
     @Nullable private var mHeaders: ReadableMap? = null
     private var mWidth = YogaConstants.UNDEFINED
     @Nullable private var mResizeMode: String? = null
     private var mHeight = YogaConstants.UNDEFINED
     private var mTintColor = 0
 
     @ReactProp(name = "src")
     public fun setSource(@Nullable sources: ReadableArray?) {
         val source =
             if (sources == null || sources.size() == 0 || sources.getType(0) != ReadableType.Number)
                 null
             else
                 Preconditions.checkNotNull(sources.getMap(0)).getString("uri")
         var uri: Uri? = null
         if (source != null) {
             try {
                 uri = Uri.parse(source)
                 // Verify scheme is set, so that relative uri (used by static resources) are not handled.
                 if (uri.scheme == null) {
                     uri = null
                 }
             } catch (e: Exception) {
                 // ignore malformed uri, then attempt to extract resource ID.
             }
             if (uri == null) {
                 uri = getResourceDrawableUri(getThemedContext(), source)
             }
         }
         if (uri != mUri) {
             markUpdated()
         }
         mUri = uri
     }
 
     @ReactProp(name = "headers")
     public fun setHeaders(@Nullable headers: ReadableMap?) {
         mHeaders = headers
     }
 
     @ReactProp(name = "tintColor", customType = "Color")
     public fun setTintColor(tintColor: Int) {
         mTintColor = tintColor
     }
 
     /** Besides width/height, all other layout props on inline images are ignored */
     override fun setWidth(width: Dynamic) {
         if (width.type == ReadableType.Number) {
             mWidth = width.asDouble().toFloat()
         } else {
             FLog.w(ReactConstants.TAG, "Inline images must not have percentage based width")
             mWidth = YogaConstants.UNDEFINED
         }
     }
 
     override fun setHeight(height: Dynamic) {
         if (height.type == ReadableType.Number) {
             mHeight = height.asDouble().toFloat()
         } else {
             FLog.w(ReactConstants.TAG, "Inline images must not have percentage based height")
             mHeight = YogaConstants.UNDEFINED
         }
     }
 
     @ReactProp(name = ViewProps.RESIZE_MODE)
     public fun setResizeMode(@Nullable resizeMode: String?) {
         mResizeMode = resizeMode
     }
 
     public fun getUri(): Uri? {
         return mUri
     }
 
     public fun getHeaders(): ReadableMap? {
         return mHeaders
     }
 
     // TODO: t9053573 is tracking that this code should be shared
     companion object {
         public fun getResourceDrawableUri(context: Context, @Nullable name: String?): Uri? {
             if (name == null || name.isEmpty()) {
                 return null
             }
             val name = name.toLowerCase(Locale.getDefault()).replace("-", "_")
             val resId = context.resources.getIdentifier(name, "drawable", context.packageName)
             return Uri.Builder()
                 .scheme(UriUtil.LOCAL_RESOURCE_SCHEME)
                 .path(resId.toString())
                 .build()
         }
     }
 
     override fun isVirtual(): Boolean {
         return true
     }
 
     override fun buildInlineImageSpan(): TextInlineImageSpan {
         val resources = getThemedContext().resources
         val width = Math.ceil(mWidth.toDouble()).toInt()
         val height = Math.ceil(mHeight.toDouble()).toInt()
         return FrescoBasedReactTextInlineImageSpan(
             resources,
             height,
             width,
             mTintColor,
             getUri(),
             getHeaders(),
             getDraweeControllerBuilder(),
             getCallerContext(),
             mResizeMode
         )
     }
 
     public fun getDraweeControllerBuilder(): AbstractDraweeControllerBuilder<*, *, *, *> {
         return mDraweeControllerBuilder
     }
 
     public fun getCallerContext(): Any? {
         return mCallerContext
     }
 }