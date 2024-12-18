/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.view.View
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.ThemedReactContext

/**
 * Manages raw text nodes. Since they are used only as a virtual nodes any type of native view
 * operation will throw an [IllegalStateException]
 */
@ReactModule(name = ReactVirtualTextViewManager.REACT_CLASS)
internal class ReactVirtualTextViewManager : BaseViewManager<View, ReactVirtualTextShadowNode>() {

  public override fun getName(): String = REACT_CLASS

  protected override fun createViewInstance(context: ThemedReactContext): View {
    throw IllegalStateException("Attempt to create a native view for RCTVirtualText")
  }

  public override fun updateExtraData(view: View, extraData: Any): Unit {}

  public override fun getShadowNodeClass(): Class<ReactVirtualTextShadowNode> =
      ReactVirtualTextShadowNode::class.java

  override fun createShadowNodeInstance(): ReactVirtualTextShadowNode = ReactVirtualTextShadowNode()

  internal companion object {
    public const val REACT_CLASS: String = "RCTVirtualText"
  }
}
