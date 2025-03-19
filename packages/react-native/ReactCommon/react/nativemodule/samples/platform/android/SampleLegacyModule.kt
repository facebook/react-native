/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.fbreact.specs

import android.widget.Toast
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = SampleLegacyModule.NAME)
public class SampleLegacyModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {
  private var toast: Toast? = null

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getBool(arg: Boolean?): Boolean? {
    log("getBool", arg, arg)
    return arg
  }

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getEnum(arg: Double?): Double? {
    log("getEnum", arg, arg)
    return arg
  }

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getDouble(arg: Double?): Double? {
    log("getDouble", arg, arg)
    return arg
  }

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getInt(arg: Int?): Int? {
    log("getInt", arg, arg)
    return arg
  }

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getFloat(arg: Float?): Float? {
    log("getFloat", arg, arg)
    return arg
  }

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getObjectDouble(arg: Double?): Double? {
    log("getObjectDouble", arg, arg)
    return arg
  }

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getObjectInteger(arg: Int?): Int? {
    log("getObjectInteger", arg, arg)
    return arg
  }

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getObjectFloat(arg: Float?): Float? {
    log("getObjectFloat", arg, arg)
    return arg
  }

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getString(arg: String?): String? {
    log("getString", arg, arg)
    return arg
  }

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getRootTag(arg: Double?): Double? {
    log("getRootTag", arg, arg)
    return arg
  }

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod
  public fun voidFunc() {
    log("voidFunc", "<void>", "<void>")
    return
  }

  // This function returns {@link WritableMap} instead of {@link Map} for backward compat with
  // existing native modules that use this Writable* as return types or in events. {@link
  // WritableMap} is modified in the Java side, and read (or consumed) on the C++ side.
  // In the future, all native modules should ideally return an immutable Map
  @DoNotStrip
  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getObject(arg: ReadableMap?): WritableMap {
    val map = WritableNativeMap()
    arg?.let { map.merge(it) }
    log("getObject", arg, map)
    return map
  }

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getUnsafeObject(arg: ReadableMap?): WritableMap {
    val map = WritableNativeMap()
    arg?.let { map.merge(it) }
    log("getUnsafeObject", arg, map)
    return map
  }

  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getDynamic(dynamic: Dynamic?): WritableMap {
    val resultMap = WritableNativeMap()
    when (dynamic?.type) {
      ReadableType.Null -> {
        log("getDynamic as Null", dynamic, dynamic)
        resultMap.putString("type", "Null")
        resultMap.putNull("value")
      }
      ReadableType.Boolean -> {
        val result = dynamic.asBoolean()
        log("getDynamic as Boolean", dynamic, result)
        resultMap.putString("type", "Boolean")
        resultMap.putBoolean("value", result)
      }
      ReadableType.Number -> {
        val result = dynamic.asInt()
        log("getDynamic as Number", dynamic, result)
        resultMap.putString("type", "Number")
        resultMap.putInt("value", result)
      }
      ReadableType.String -> {
        val result = dynamic.asString()
        log("getDynamic as String", dynamic, result)
        resultMap.putString("type", "String")
        resultMap.putString("value", result)
      }
      ReadableType.Array -> {
        val result = dynamic.asArray()
        log("getDynamic as Array", dynamic, result)
        resultMap.putString("type", "Array")
        resultMap.putArray("value", result)
      }
      ReadableType.Map -> {
        val result = dynamic.asMap()
        log("getDynamic as Map", dynamic, result)
        resultMap.putString("type", "Map")
        resultMap.putMap("value", result)
      }
      else -> error("Unsupported dynamic type")
    }
    return resultMap
  }

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getValue(numberArg: Double?, stringArg: String?, mapArg: ReadableMap?): WritableMap {
    val map: WritableMap =
        WritableNativeMap().apply {
          putDouble("x", numberArg ?: 0.0)
          putString("y", stringArg)
        }
    val zMap: WritableMap = WritableNativeMap()
    mapArg?.let { zMap.merge(it) }
    map.putMap("z", zMap)
    log(
        "getValue",
        mapOf("1-numberArg" to numberArg, "2-stringArg" to stringArg, "3-mapArg" to mapArg),
        map)
    return map
  }

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod
  public fun getValueWithCallback(callback: Callback?) {
    val result = "Value From Callback"
    log("Callback", "Return Time", result)
    callback?.invoke(result)
  }

  @DoNotStrip
  @Suppress("unused")
  @ReactMethod(isBlockingSynchronousMethod = true)
  public fun getArray(arg: ReadableArray?): WritableArray {
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
  @ReactMethod
  public fun getValueWithPromise(error: Boolean, promise: Promise?) {
    if (error) {
      promise?.reject(
          "code 1", "intentional promise rejection", Throwable("promise intentionally rejected"))
    } else {
      promise?.resolve("result")
    }
  }

  override fun getConstants(): Map<String, Any> {
    val result: MutableMap<String, Any> = mutableMapOf()
    val activity = context.currentActivity
    if (activity != null) {
      result["const2"] = 390
    }
    result["const1"] = true
    result["const3"] = "something"
    log("constantsToExport", "", result)
    return result
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

  public companion object {
    public const val NAME: String = "SampleLegacyModule"
  }
}
