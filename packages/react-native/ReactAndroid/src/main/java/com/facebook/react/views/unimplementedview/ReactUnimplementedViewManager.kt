/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.unimplementedview

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.UnimplementedNativeViewManagerDelegate
import com.facebook.react.viewmanagers.UnimplementedNativeViewManagerInterface

/** ViewManager for [ReactUnimplementedView] to represent a component that is not yet supported. */
@ReactModule(name = ReactUnimplementedViewManager.REACT_CLASS)
internal class ReactUnimplementedViewManager :
    ViewGroupManager<ReactUnimplementedView>(),
    UnimplementedNativeViewManagerInterface<ReactUnimplementedView> {

  private val delegate: ViewManagerDelegate<ReactUnimplementedView> =
      UnimplementedNativeViewManagerDelegate(this)

  public override fun getDelegate(): ViewManagerDelegate<ReactUnimplementedView> = delegate

  protected override fun createViewInstance(
      reactContext: ThemedReactContext
  ): ReactUnimplementedView = ReactUnimplementedView(reactContext)

  public override fun getName(): String = REACT_CLASS

  @ReactProp(name = "name")
  public override fun setName(view: ReactUnimplementedView, name: String?): Unit {
    view.setName(name ?: "<null component name>")
  }

  internal companion object {
    public const val REACT_CLASS: String = "UnimplementedNativeView"
  }
}
