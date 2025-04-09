/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.view.View
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.ThemedReactContext

/**
 * Manages raw text nodes. Since they are used only as a virtual nodes any type of native view
 * operation will throw an [IllegalStateException]
 */
@ReactModule(name = ReactVirtualTextViewManager.REACT_CLASS)
@LegacyArchitecture
internal class ReactVirtualTextViewManager : BaseViewManager<View, ReactVirtualTextShadowNode>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext): View {
    throw IllegalStateException("Attempt to create a native view for RCTVirtualText")
  }

  override fun updateExtraData(view: View, extraData: Any): Unit = Unit

  override fun getShadowNodeClass(): Class<ReactVirtualTextShadowNode> =
      ReactVirtualTextShadowNode::class.java

  override fun createShadowNodeInstance(): ReactVirtualTextShadowNode = ReactVirtualTextShadowNode()

  internal companion object {
    const val REACT_CLASS: String = "RCTVirtualText"
  }
}
