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

  public override fun getName(): String {
    return REACT_CLASS
  }

  public override fun createViewInstance(context: ThemedReactContext): ReactTextView =
      throw IllegalStateException("Attempt to create a native view for RCTRawText")

  protected override fun prepareToRecycleView(reactContext: ThemedReactContext, view: View): View? =
      throw IllegalStateException("Attempt to recycle a native view for RCTRawText")

  public override fun updateExtraData(view: View, extraData: Any): Unit = Unit

  public override fun getShadowNodeClass(): Class<ReactRawTextShadowNode> {
    return ReactRawTextShadowNode::class.java
  }

  public override fun createShadowNodeInstance(): ReactRawTextShadowNode {
    return ReactRawTextShadowNode()
  }

  internal companion object {
    const val REACT_CLASS: String = "RCTRawText"
  }
}
