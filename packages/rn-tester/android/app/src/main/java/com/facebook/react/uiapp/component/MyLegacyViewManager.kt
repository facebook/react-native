/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component

import android.graphics.Color
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp

/** Legacy View manager (non Fabric compatible) for {@link MyNativeView} components. */
@ReactModule(name = MyLegacyViewManager.REACT_CLASS)
internal class MyLegacyViewManager(reactContext: ReactApplicationContext) :
    SimpleViewManager<MyNativeView>() {

  private val callerContext: ReactApplicationContext = reactContext

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(themedReactContext: ThemedReactContext): MyNativeView =
      MyNativeView(themedReactContext).apply { setBackgroundColor(Color.RED) }

  @ReactProp(name = ViewProps.OPACITY, defaultFloat = 1f)
  override fun setOpacity(view: MyNativeView, opacity: Float) {
    super.setOpacity(view, opacity)
  }

  @ReactProp(name = ViewProps.COLOR)
  fun setColor(view: MyNativeView, color: String) {
    view.setBackgroundColor(Color.parseColor(color))
  }

  @ReactProp(name = "cornerRadius")
  fun setCornerRadius(view: MyNativeView, cornerRadius: Float) {
    if (cornerRadius !== null) {
      view.setCornerRadius(cornerRadius)
    }
  }

  override fun getExportedViewConstants(): Map<String, Any> = mapOf("PI" to 3.14)

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> {
    return MapBuilder.builder<String, Any>()
        .put(
            "onColorChanged",
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onColorChanged", "captured", "onColorChangedCapture")))
        .build()
  }

  override fun receiveCommand(view: MyNativeView, commandId: String, args: ReadableArray?) {
    if (commandId.contentEquals("changeBackgroundColor")) {
      val sentColor: Int = Color.parseColor(args?.getString(0))
      view.setBackgroundColor(sentColor)
    }
  }

  @Suppress("DEPRECATION") // We intentionally want to test against the legacy API here.
  override fun receiveCommand(view: MyNativeView, commandId: Int, args: ReadableArray?) {
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
    const val REACT_CLASS = "RNTMyLegacyNativeView"
    const val COMMAND_CHANGE_BACKGROUND_COLOR = 42
  }
}
