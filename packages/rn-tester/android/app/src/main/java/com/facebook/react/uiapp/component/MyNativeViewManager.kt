/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component

import android.graphics.Color
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.RNTMyNativeViewManagerDelegate
import com.facebook.react.viewmanagers.RNTMyNativeViewManagerInterface

/** View manager for MyNativeView components. */
@ReactModule(name = MyNativeViewManager.REACT_CLASS)
internal class MyNativeViewManager :
    SimpleViewManager<MyNativeView>(), RNTMyNativeViewManagerInterface<MyNativeView> {

  companion object {
    const val REACT_CLASS = "RNTMyNativeView"
  }

  private val delegate: ViewManagerDelegate<MyNativeView> = RNTMyNativeViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<MyNativeView> = delegate

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): MyNativeView =
      MyNativeView(reactContext)

  override fun receiveCommand(view: MyNativeView, commandName: String, args: ReadableArray?) {
    delegate.receiveCommand(view, commandName, args)
  }

  override fun callNativeMethodToChangeBackgroundColor(view: MyNativeView, color: String) {
    view.setBackgroundColor(Color.parseColor(color))
  }

  @ReactProp(name = ViewProps.OPACITY, defaultFloat = 1f)
  override fun setOpacity(view: MyNativeView, opacity: Float) {
    super.setOpacity(view, opacity)
  }

  @ReactProp(name = "values")
  override fun setValues(view: MyNativeView, value: ReadableArray?) {
    val values = mutableListOf<Int>()
    value?.toArrayList()?.forEach { values.add((it as Double).toInt()) }
    view.emitOnArrayChangedEvent(values)
  }

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> =
      MapBuilder.builder<String, Any>()
          .put(
              "topIntArrayChanged",
              MapBuilder.of<String, Any>(
                  "phasedRegistrationNames",
                  MapBuilder.of(
                      "bubbled", "onIntArrayChanged", "captured", "onIntArrayChangedCapture")))
          .build()
}
