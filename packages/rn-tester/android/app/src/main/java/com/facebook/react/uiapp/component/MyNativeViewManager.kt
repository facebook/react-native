/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component

import android.graphics.Color
import androidx.annotation.ColorInt
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
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

  private var delegatedInitialProps  = ReactStylesDiffMap(WritableNativeMap()) // capture props
  override fun createViewInstance(
    reactTag: Int,
    reactContext: ThemedReactContext,
    initialProps: ReactStylesDiffMap?,
    stateWrapper: StateWrapper?
  ): MyNativeView {
    if (initialProps != null) {
      delegatedInitialProps = initialProps
    }
    return super.createViewInstance(reactTag, reactContext, initialProps, stateWrapper)
  }

    override fun createViewInstance(reactContext: ThemedReactContext): MyNativeView {
      // here, assume that all props from initialProps are urgently needed during view creation
      if (!delegatedInitialProps.hasKey("isEnabled")) {
        throw IllegalStateException("isEnabled prop is required for MyNativeView!")
        // Note: i know that there is .getBoolean(value, defaultFallback).
        // But the point is that I don't want to repeat typing the prop name in multiple places.
        // "Worse" additionally, the user might has even passed the default value explicitly as prop,
        // but its not received here on the native side.
      }
      return MyNativeView(reactContext /*, someComputedValue */)
    }

  override fun callNativeMethodToChangeBackgroundColor(view: MyNativeView, color: String) {
    view.setBackgroundColor(Color.parseColor(color))
  }

  override fun callNativeMethodToAddOverlays(view: MyNativeView, overlayColors: ReadableArray) {
    view.addOverlays(overlayColors)
  }

  override fun callNativeMethodToRemoveOverlays(view: MyNativeView) {
    view.removeOverlays()
  }

  override fun fireLagacyStyleEvent(view: MyNativeView) {
    view.emitLegacyStyleEvent()
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

  override fun setBackgroundColor(view: MyNativeView, @ColorInt backgroundColor: Int) {
    view.setBackgroundColor(backgroundColor)
  }

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> =
      mapOf(
          "topIntArrayChanged" to
              mapOf(
                  "phasedRegistrationNames" to
                      mapOf(
                          "bubbled" to "onIntArrayChanged",
                          "captured" to "onIntArrayChangedCapture",
                      )
              )
      )

  override fun setIsEnabled(view: MyNativeView?, value: Boolean) {
    TODO("setIsEnabled called with value: $value")
  }
}
