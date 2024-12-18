/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.fbreact.specs

import android.os.Build
import android.util.DisplayMetrics
import android.widget.Toast
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.turbomodule.core.interfaces.BindingsInstallerHolder
import com.facebook.react.turbomodule.core.interfaces.TurboModuleWithJSIBindings

@DoNotStrip
@ReactModule(name = SampleTurboModule.NAME)
public class SampleTurboModule(private val context: ReactApplicationContext) :
    NativeSampleTurboModuleSpec(context), TurboModuleWithJSIBindings {

  private var toast: Toast? = null

  @DoNotStrip
  override fun getBool(arg: Boolean): Boolean {
    log("getBool", arg, arg)
    return arg
  }

  @DoNotStrip
  override fun getEnum(arg: Double): Double {
    log("getEnum", arg, arg)
    return arg
  }

  override fun getTypedExportedConstants(): MutableMap<String, Any> {
    val result: MutableMap<String, Any> = mutableMapOf()
    val activity = context.currentActivity
    if (activity != null) {
      @Suppress("DEPRECATION")
      val widthPixels =
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            activity.windowManager.currentWindowMetrics.bounds.width()
          } else {
            val displayMetrics = DisplayMetrics()
            activity.windowManager.defaultDisplay.getMetrics(displayMetrics)
            displayMetrics.widthPixels
          }
      result["const2"] = widthPixels
    }
    result["const1"] = true
    result["const3"] = "something"
    log("constantsToExport", "", result)
    return result
  }

  @DoNotStrip
  override fun getNumber(arg: Double): Double {
    log("getNumber", arg, arg)
    return arg
  }

  @DoNotStrip
  override fun getString(arg: String?): String? {
    log("getString", arg, arg)
    return arg
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getRootTag(arg: Double): Double {
    log("getRootTag", arg, arg)
    return arg
  }

  @DoNotStrip
  override fun voidFunc() {
    log("voidFunc", "<void>", "<void>")
    emitOnPress()
    emitOnClick("click")
    run {
      val map =
          WritableNativeMap().apply {
            putInt("a", 1)
            putString("b", "two")
          }
      emitOnChange(map)
    }
    run {
      val array = WritableNativeArray()
      val map1 =
          WritableNativeMap().apply {
            putInt("a", 1)
            putString("b", "two")
          }
      val map2 =
          WritableNativeMap().apply {
            putInt("a", 3)
            putString("b", "four")
          }
      array.pushMap(map1)
      array.pushMap(map2)
      emitOnSubmit(array)
    }
  }

  // This function returns {@link WritableMap} instead of {@link Map} for backward compat with
  // existing native modules that use this Writable* as return types or in events. {@link
  // WritableMap} is modified in the Java side, and read (or consumed) on the C++ side.
  // In the future, all native modules should ideally return an immutable Map
  @DoNotStrip
  @Suppress("unused")
  override fun getObject(arg: ReadableMap?): WritableMap {
    val map = WritableNativeMap()
    arg?.let { map.merge(it) }
    log("getObject", arg, map)
    return map
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getUnsafeObject(arg: ReadableMap?): WritableMap {
    val map = WritableNativeMap()
    arg?.let { map.merge(it) }
    log("getUnsafeObject", arg, map)
    return map
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getValue(x: Double, y: String?, z: ReadableMap?): WritableMap {
    val map: WritableMap = WritableNativeMap()
    map.putDouble("x", x)
    map.putString("y", y)
    val zMap: WritableMap = WritableNativeMap()
    z?.let { zMap.merge(it) }
    map.putMap("z", zMap)
    log("getValue", mapOf("1-numberArg" to x, "2-stringArg" to y, "3-mapArg" to z), map)
    return map
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getValueWithCallback(callback: Callback?) {
    val result = "Value From Callback"
    log("Callback", "Return Time", result)
    callback?.invoke(result)
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getArray(arg: ReadableArray?): WritableArray {
    if (arg == null || Arguments.toList(arg) == null) {
      // Returning an empty array, since the super class always returns non-null
      return WritableNativeArray()
    }
    val result: WritableArray = Arguments.makeNativeArray(Arguments.toList(arg))
    log("getArray", arg, result)
    return result
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getValueWithPromise(error: Boolean, promise: Promise?) {
    if (error) {
      promise?.reject(
          "code 1", "intentional promise rejection", Throwable("promise intentionally rejected"))
    } else {
      promise?.resolve("result")
    }
  }

  @DoNotStrip
  @Suppress("unused")
  override fun voidFuncThrows() {
    error("Intentional exception from JVM voidFuncThrows")
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getObjectThrows(arg: ReadableMap?): WritableMap? {
    error("Intentional exception from JVM getObjectThrows with $arg")
  }

  @DoNotStrip
  @Suppress("unused")
  override fun promiseThrows(promise: Promise?) {
    error("Intentional exception from JVM promiseThrows")
  }

  @DoNotStrip
  @Suppress("unused")
  override fun voidFuncAssert() {
    assert(false) { "Intentional assert from JVM voidFuncAssert" }
  }

  @DoNotStrip
  @Suppress("unused")
  override fun getObjectAssert(arg: ReadableMap?): WritableMap? {
    assert(false) { "Intentional assert from JVM getObjectAssert with $arg" }
    return null
  }

  @DoNotStrip
  @Suppress("unused")
  override fun promiseAssert(promise: Promise?) {
    assert(false) { "Intentional assert from JVM promiseAssert" }
  }

  private fun log(method: String, input: Any?, output: Any?) {
    toast?.cancel()
    val message = StringBuilder("Method :")
    message
        .append(method)
        .append("\nInputs: ")
        .append(input.toString())
        .append("\nOutputs: ")
        .append(output.toString())
    toast = Toast.makeText(context, message.toString(), Toast.LENGTH_LONG)
    toast?.show()
  }

  override fun invalidate(): Unit = Unit

  override fun getName(): String {
    return NAME
  }

  @DoNotStrip external override fun getBindingsInstaller(): BindingsInstallerHolder

  public companion object {
    public const val NAME: String = "SampleTurboModule"
  }
}
