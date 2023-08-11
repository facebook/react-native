/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.View
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.RCTEventEmitter

class MyNativeView(context: Context) : View(context) {
  private var currentColor = 0
  private var background: GradientDrawable = GradientDrawable()

  override fun setBackgroundColor(color: Int) {
    if (color != currentColor) {
      background.setColor(color)
      currentColor = color
      emitNativeEvent(color)
      setBackground(background)
    }
  }

  fun setCornerRadius(cornerRadius: Float) {
    background.setCornerRadius(cornerRadius)
    setBackground(background)
  }

  private fun emitNativeEvent(color: Int) {
    val event = Arguments.createMap()
    val backgroundColor = Arguments.createMap()
    val hsv = FloatArray(3)

    Color.colorToHSV(color, hsv)
    backgroundColor.putDouble("hue", hsv[0].toDouble())
    backgroundColor.putDouble("saturation", hsv[1].toDouble())
    backgroundColor.putDouble("brightness", hsv[2].toDouble())
    backgroundColor.putDouble("alpha", Color.alpha(color).toDouble())
    event.putMap("backgroundColor", backgroundColor)

    val reactContext = context as ReactContext
    reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "onColorChanged", event)
  }

  fun emitOnArrayChangedEvent(ints: List<Int>) {
    val payload = Arguments.createMap()
    val newIntArray = Arguments.createArray()
    val newBoolArray = Arguments.createArray()
    val newFloatArray = Arguments.createArray()
    val newDoubleArray = Arguments.createArray()
    val newYesNoArray = Arguments.createArray()
    val newStringArray = Arguments.createArray()
    val newObjectArray = Arguments.createArray()
    val newArrayArray = Arguments.createArray()

    for (i in ints) {
      newIntArray.pushInt(i * 2)
      newBoolArray.pushBoolean(i % 2 == 1)
      newFloatArray.pushDouble(i * 3.14)
      newDoubleArray.pushDouble(i / 3.14)
      newYesNoArray.pushString(if (i % 2 == 1) "yep" else "nope")
      newStringArray.pushString(i.toString())

      val latLon = Arguments.createMap()
      latLon.putDouble("lat", -1.0 * i)
      latLon.putDouble("lon", 2.0 * i)
      newObjectArray.pushMap(latLon)

      val innerArray: WritableArray = Arguments.createArray()
      innerArray.pushInt(i)
      innerArray.pushInt(i)
      innerArray.pushInt(i)
      newArrayArray.pushArray(innerArray)
    }

    payload.putArray("values", newIntArray)
    payload.putArray("boolValues", newBoolArray)
    payload.putArray("floats", newFloatArray)
    payload.putArray("doubles", newDoubleArray)
    payload.putArray("yesNos", newYesNoArray)
    payload.putArray("strings", newStringArray)
    payload.putArray("latLons", newObjectArray)
    payload.putArray("multiArrays", newArrayArray)

    val reactContext = context as ReactContext
    val surfaceId = UIManagerHelper.getSurfaceId(reactContext)
    val eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)
    val event = OnIntArrayChangedEvent(surfaceId, id, payload)

    eventDispatcher?.dispatchEvent(event)
  }

  inner class OnIntArrayChangedEvent(surfaceId: Int, viewId: Int, private val payload: WritableMap) : Event<OnIntArrayChangedEvent>(surfaceId, viewId) {
    override fun getEventName() =  "onIntArrayChanged"

    override fun getEventData() = payload
  }
}
