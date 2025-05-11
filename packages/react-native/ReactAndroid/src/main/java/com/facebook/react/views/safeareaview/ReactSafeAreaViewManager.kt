/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.safeareaview

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.SafeAreaViewManagerDelegate
import com.facebook.react.viewmanagers.SafeAreaViewManagerInterface

/** View manager for [ReactSafeAreaView] components. */
@ReactModule(name = ReactSafeAreaViewManager.REACT_CLASS)
internal class ReactSafeAreaViewManager :
    ViewGroupManager<ReactSafeAreaView>(), SafeAreaViewManagerInterface<ReactSafeAreaView> {

  private val delegate: ViewManagerDelegate<ReactSafeAreaView> = SafeAreaViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<ReactSafeAreaView> = delegate

  override fun createViewInstance(context: ThemedReactContext): ReactSafeAreaView =
      ReactSafeAreaView(context)

  override fun getName(): String = REACT_CLASS

  override fun createShadowNodeInstance(): LayoutShadowNode = ReactSafeAreaViewShadowNode()

  override fun getShadowNodeClass(): Class<out LayoutShadowNode> =
      ReactSafeAreaViewShadowNode::class.java

  override fun updateState(
      view: ReactSafeAreaView,
      props: ReactStylesDiffMap,
      stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    return null
  }

  internal companion object {
    const val REACT_CLASS: String = "RCTSafeAreaView"
  }
}
