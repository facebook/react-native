/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.osslibraryexample

import android.annotation.SuppressLint
import android.graphics.Color
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.SampleNativeComponentManagerInterface

/** Legacy View manager (non Fabric compatible) for {@link SampleNativeView} components. */
@ReactModule(name = SampleNativeComponentViewManager.REACT_CLASS)
internal class SampleNativeComponentViewManager :
    SimpleViewManager<SampleNativeView>(), SampleNativeComponentManagerInterface<SampleNativeView> {

  override fun getName(): String = REACT_CLASS

  // @ReactProp(name = ViewProps.OPACITY, defaultFloat = 1f)
  override fun setOpacity(view: SampleNativeView, opacity: Float) {
    super.setOpacity(view, opacity)
  }

  @SuppressLint("BadMethodUse-android.view.View.setBackgroundColor")
  @ReactProp(name = ViewProps.COLOR)
  fun setColor(view: SampleNativeView, color: String) {
    view.setBackgroundColor(Color.parseColor(color))
  }

  @ReactProp(name = "cornerRadius")
  fun setCornerRadius(view: SampleNativeView, cornerRadius: Float) {
    view.setCornerRadius(cornerRadius)
  }

  override fun createViewInstance(reactContext: ThemedReactContext): SampleNativeView =
      SampleNativeView(reactContext)

  @SuppressLint("BadMethodUse-android.view.View.setBackgroundColor")
  override fun changeBackgroundColor(view: SampleNativeView, color: String) {
    view.setBackgroundColor(Color.parseColor(color))
  }

  override fun getExportedViewConstants(): Map<String, Any> = mapOf("PI" to 3.14)

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> {
    return mapOf(
        "onColorChanged" to
            mapOf(
                "phasedRegistrationNames" to
                    mapOf(
                        "bubbled" to "onColorChanged",
                        "captured" to "onColorChangedCapture",
                    )),
        "topIntArrayChanged" to
            mapOf(
                "phasedRegistrationNames" to
                    mapOf(
                        "bubbled" to "topIntArrayChanged",
                        "captured" to "topIntArrayChangedCapture",
                    )))
  }

  @SuppressLint("BadMethodUse-android.view.View.setBackgroundColor")
  override fun receiveCommand(view: SampleNativeView, commandId: String, args: ReadableArray?) {
    if (commandId.contentEquals("changeBackgroundColor")) {
      val sentColor: Int = Color.parseColor(args?.getString(0))
      view.setBackgroundColor(sentColor)
    }
  }

  @Deprecated("Deprecated in Java")
  @SuppressLint("BadMethodUse-android.view.View.setBackgroundColor")
  @Suppress("DEPRECATION") // We intentionally want to test against the legacy API here.
  override fun receiveCommand(view: SampleNativeView, commandId: Int, args: ReadableArray?) {
    when (commandId) {
      COMMAND_CHANGE_BACKGROUND_COLOR -> {
        val sentColor: Int = Color.parseColor(args?.getString(0))
        view.setBackgroundColor(sentColor)
      }
    }
  }

  override fun getCommandsMap(): Map<String, Int> =
      mapOf("changeBackgroundColor" to COMMAND_CHANGE_BACKGROUND_COLOR)

  companion object {
    const val REACT_CLASS = "SampleNativeComponent"
    const val COMMAND_CHANGE_BACKGROUND_COLOR = 42
  }

  @ReactProp(name = "values")
  override fun setValues(view: SampleNativeView, value: ReadableArray?) {
    val values = mutableListOf<Int>()
    value?.toArrayList()?.forEach { values.add((it as Double).toInt()) }
    view.emitOnArrayChangedEvent(values)
  }
}
