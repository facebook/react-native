/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component

import android.graphics.Color
import androidx.annotation.NonNull
import androidx.annotation.Nullable
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import kotlin.collections.mapOf

/** Legacy View manager (non Fabric compatible) for {@link MyNativeView} components. */
@ReactModule(name = MyLegacyViewManager.REACT_CLASS)
public class MyLegacyViewManager : SimpleViewManager<MyNativeView> {

  companion object {
    const val REACT_CLASS = "RNTMyLegacyNativeView"
  }

  companion object {
    const val COMMAND_CHANGE_BACKGROUND_COLOR = 42
  }

  private val ReactApplicationContext mCallerContext

  public fun MyLegacyViewManager(reactContext: ReactApplicationContext) {
    mCallerContext = reactContext
  }

  override fun getName(): String {
    return REACT_CLASS
  }

  override fun createViewInstance(@NonNull reactContext: ThemedReactContext): MyNativeView {
    val view = MyNativeView(reactContext)
    view.setBackgroundColor(Color.RED)
    return view
  }

  @ReactProp(name = ViewProps.OPACITY, defaultFloat = 1f)
  override fun setOpacity(@NonNull view: MyNativeView, opacity: Float) {
    super.setOpacity(view, opacity)
  }

  @ReactProp(name = ViewProps.COLOR)
  fun setColor(@NonNull view: MyNativeView, @Nullable color: String?) {
    view.setBackgroundColor(Color.parseColor(color))

  }

  @ReactProp(name = "cornerRadius")
  fun setCornerRadius(@NonNull view: MyNativeView, @Nullable cornerRadius: Float?) {
    view.setCornerRadius(cornerRadius)
  }

  override fun getExportedViewConstants(): Map<String, Any> {
    return mapOf("PI" to 3.14)
  }

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> {
    return MapBuilder.builder<String, Any>()
      .put(
        "onColorChanged",
        MapBuilder.of(
          "phasedRegistrationNames",
          MapBuilder.of(
            "bubbled",
            "onColorChanged",
            "captured",
            "onColorChangedCapture"
          )
        )
      )
      .build()
  }

  override fun receiveCommand(
    @NonNull view: MyNativeView, commandId: String, @Nullable args: ReadableArray?
  ) {
    if (commandId.contentEquals("changeBackgroundColor")) {
      val sentColor: Int = Color.parseColor(args.getString(0));
      view.setBackgroundColor(sentColor);
    }
  }

  @SuppressWarnings("deprecation") // We intentionally want to test against the legacy API here.
  override fun receiveCommand(
    @NonNull view: MyNativeView, commandId: Int, @Nullable args: ReadableArray?
  ) {
    when (commandId) {
      COMMAND_CHANGE_BACKGROUND_COLOR -> {
        val sentColor: Int = Color.parseColor(args.getString(0))
        view.setBackgroundColor(sentColor)
      }
    }
  }

  @Nullable
  override fun getCommandsMap(): Map<String, Integer> {
    return MapBuilder.of("changeBackgroundColor", COMMAND_CHANGE_BACKGROUND_COLOR);
  }
}
