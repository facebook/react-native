/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.unimplementedview

import com.facebook.common.logging.FLog
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.UnimplementedNativeViewManagerDelegate
import com.facebook.react.viewmanagers.UnimplementedNativeViewManagerInterface

/**
 * ViewManager that renders [ReactUnimplementedView] to represent a component that is not properly
 * implemented or registered.
 */
@ReactModule(name = ReactUnimplementedViewManager.REACT_CLASS)
internal class ReactUnimplementedViewManager(
    private val onError: ((message: String) -> Unit) = { message: String ->
      FLog.e(REACT_CLASS, message)
    }
) :
    ViewGroupManager<ReactUnimplementedView>(),
    UnimplementedNativeViewManagerInterface<ReactUnimplementedView> {

  private val delegate: ViewManagerDelegate<ReactUnimplementedView> =
      UnimplementedNativeViewManagerDelegate(this)

  public override fun getDelegate(): ViewManagerDelegate<ReactUnimplementedView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): ReactUnimplementedView =
      ReactUnimplementedView(reactContext, onError)

  override fun getName(): String = REACT_CLASS

  @ReactProp(name = "name")
  override fun setName(view: ReactUnimplementedView, name: String?): Unit =
      view.setName(name ?: "<null component name>")

  internal companion object {
    const val REACT_CLASS: String = "UnimplementedNativeView"
  }
}
