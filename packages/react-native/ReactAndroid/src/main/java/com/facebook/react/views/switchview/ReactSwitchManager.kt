/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.switchview

import android.content.Context
import android.view.View
import android.widget.CompoundButton
import androidx.annotation.ColorInt
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.AndroidSwitchManagerDelegate
import com.facebook.react.viewmanagers.AndroidSwitchManagerInterface
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput

internal class ReactSwitchManager :
    BaseViewManager<ReactSwitch, ReactSwitchShadowNode>(),
    AndroidSwitchManagerInterface<ReactSwitch> {

  private val delegate: ViewManagerDelegate<ReactSwitch> = AndroidSwitchManagerDelegate(this)

  override fun getName(): String = REACT_CLASS

  override fun createShadowNodeInstance(): ReactSwitchShadowNode = ReactSwitchShadowNode()

  override fun getShadowNodeClass(): Class<ReactSwitchShadowNode> =
      ReactSwitchShadowNode::class.java

  override fun createViewInstance(context: ThemedReactContext): ReactSwitch =
      ReactSwitch(context).apply { showText = false }

  override fun setBackgroundColor(view: ReactSwitch, @ColorInt backgroundColor: Int) {
    view.setBackgroundColor(backgroundColor)
  }

  @ReactProp(name = "disabled", defaultBoolean = false)
  override fun setDisabled(view: ReactSwitch, disabled: Boolean) {
    view.isEnabled = !disabled
  }

  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  override fun setEnabled(view: ReactSwitch, enabled: Boolean) {
    view.isEnabled = enabled
  }

  @ReactProp(name = ViewProps.ON)
  override fun setOn(view: ReactSwitch, on: Boolean) {
    setValueInternal(view, on)
  }

  @ReactProp(name = "value")
  override fun setValue(view: ReactSwitch, value: Boolean) {
    setValueInternal(view, value)
  }

  @ReactProp(name = "thumbTintColor", customType = "Color")
  override fun setThumbTintColor(view: ReactSwitch, color: Int?) {
    setThumbColor(view, color)
  }

  @ReactProp(name = "thumbColor", customType = "Color")
  override fun setThumbColor(view: ReactSwitch, color: Int?) {
    view.setThumbColor(color)
  }

  @ReactProp(name = "trackColorForFalse", customType = "Color")
  override fun setTrackColorForFalse(view: ReactSwitch, color: Int?) {
    view.setTrackColorForFalse(color)
  }

  @ReactProp(name = "trackColorForTrue", customType = "Color")
  override fun setTrackColorForTrue(view: ReactSwitch, color: Int?) {
    view.setTrackColorForTrue(color)
  }

  @ReactProp(name = "trackTintColor", customType = "Color")
  override fun setTrackTintColor(view: ReactSwitch, color: Int?) {
    view.setTrackColor(color)
  }

  override fun setNativeValue(view: ReactSwitch, value: Boolean) {
    setValueInternal(view, value)
  }

  override fun receiveCommand(view: ReactSwitch, commandId: String, args: ReadableArray?) {
    when (commandId) {
      "setNativeValue" -> setValueInternal(view, args?.getBoolean(0) ?: false)
    }
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: ReactSwitch) {
    view.setOnCheckedChangeListener(ON_CHECKED_CHANGE_LISTENER)
  }

  override fun updateExtraData(root: ReactSwitch, extraData: Any) {
    // Do nothing
  }

  override fun getDelegate(): ViewManagerDelegate<ReactSwitch> = delegate

  override fun measure(
      context: Context,
      localData: ReadableMap?,
      props: ReadableMap?,
      state: ReadableMap?,
      width: Float,
      widthMode: YogaMeasureMode,
      height: Float,
      heightMode: YogaMeasureMode,
      attachmentsPositions: FloatArray?
  ): Long {
    val view = ReactSwitch(context).apply { showText = false }
    val measureSpec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
    view.measure(measureSpec, measureSpec)
    return YogaMeasureOutput.make(
        PixelUtil.toDIPFromPixel(view.measuredWidth.toFloat()),
        PixelUtil.toDIPFromPixel(view.measuredHeight.toFloat()))
  }

  private fun setValueInternal(view: ReactSwitch, value: Boolean) {
    // Temporarily remove the listener to avoid triggering JS events
    view.setOnCheckedChangeListener(null)
    view.setOn(value)
    view.setOnCheckedChangeListener(ON_CHECKED_CHANGE_LISTENER)
  }

  internal companion object {
    public const val REACT_CLASS: String = "AndroidSwitch"

    private val ON_CHECKED_CHANGE_LISTENER =
        CompoundButton.OnCheckedChangeListener { buttonView, isChecked ->
          val reactContext = buttonView.context as ReactContext
          val reactTag = buttonView.id
          UIManagerHelper.getEventDispatcherForReactTag(reactContext, reactTag)
              ?.dispatchEvent(
                  ReactSwitchEvent(UIManagerHelper.getSurfaceId(reactContext), reactTag, isChecked))
        }
  }
}
