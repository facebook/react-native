/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.frescosupport

import android.view.View
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.ThemedReactContext

/**
 * Manages Images embedded in Text nodes using Fresco. Since they are used only as a virtual nodes
 * any type of native view operation will throw an [IllegalStateException].
 */
@ReactModule(name = FrescoBasedReactTextInlineImageViewManager.REACT_CLASS)
internal class FrescoBasedReactTextInlineImageViewManager
@JvmOverloads
constructor(
    private val draweeControllerBuilder:
        @JvmSuppressWildcards
        AbstractDraweeControllerBuilder<*, *, *, *>? =
        null,
    private val callerContext: Any? = null
) : BaseViewManager<View, FrescoBasedReactTextInlineImageShadowNode>() {

  override fun getName(): String = REACT_CLASS

  public override fun createViewInstance(context: ThemedReactContext): View {
    throw IllegalStateException("RCTTextInlineImage doesn't map into a native view")
  }

  override fun createShadowNodeInstance(): FrescoBasedReactTextInlineImageShadowNode =
      FrescoBasedReactTextInlineImageShadowNode(
          draweeControllerBuilder ?: Fresco.newDraweeControllerBuilder(), callerContext)

  override fun getShadowNodeClass(): Class<FrescoBasedReactTextInlineImageShadowNode> =
      FrescoBasedReactTextInlineImageShadowNode::class.java

  override fun updateExtraData(root: View, extraData: Any) = Unit

  public companion object {
    public const val REACT_CLASS: String = "RCTTextInlineImage"
  }
}
