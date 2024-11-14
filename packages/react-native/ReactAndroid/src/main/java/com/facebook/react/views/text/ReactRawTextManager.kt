/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.view.View
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager

/**
 * Manages raw text nodes (aka `textContent` in terms of DOM). Since they are used only as a virtual
 * nodes, any type of native view operation will throw an [IllegalStateException].
 */
@ReactModule(name = ReactRawTextManager.REACT_CLASS)
public class ReactRawTextManager : ViewManager<View, ReactRawTextShadowNode>() {

  override public fun getName(): String {
    return REACT_CLASS
  }

  override public fun createViewInstance(context: ThemedReactContext): ReactTextView =
      throw IllegalStateException("Attempt to create a native view for RCTRawText")

  override protected fun prepareToRecycleView(reactContext: ThemedReactContext, view: View): View? =
      throw IllegalStateException("Attempt to recycle a native view for RCTRawText")

  override public fun updateExtraData(view: View, extraData: Any): Unit = Unit

  override public fun getShadowNodeClass(): Class<ReactRawTextShadowNode> {
    return ReactRawTextShadowNode::class.java
  }

  override public fun createShadowNodeInstance(): ReactRawTextShadowNode {
    return ReactRawTextShadowNode()
  }

  internal companion object {
    public const val REACT_CLASS: String = "RCTRawText"
  }
}
