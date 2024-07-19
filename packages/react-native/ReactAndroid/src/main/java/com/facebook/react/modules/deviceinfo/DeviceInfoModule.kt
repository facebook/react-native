/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.deviceinfo

import android.content.Context
import com.facebook.fbreact.specs.NativeDeviceInfoSpec
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.DisplayMetricsHolder.getDisplayMetricsWritableMap
import com.facebook.react.uimanager.DisplayMetricsHolder.initDisplayMetricsIfNotInitialized

/** Module that exposes Android Constants to JS. */
@ReactModule(name = NativeDeviceInfoSpec.NAME)
public class DeviceInfoModule : NativeDeviceInfoSpec, LifecycleEventListener {
  private var reactApplicationContext: ReactApplicationContext? = null
  private var fontScale: Float
  private var previousDisplayMetrics: ReadableMap? = null

  public constructor(reactContext: ReactApplicationContext) : super(reactContext) {
    initDisplayMetricsIfNotInitialized(reactContext)
    fontScale = reactContext.resources.configuration.fontScale
    reactContext.addLifecycleEventListener(this)
    reactApplicationContext = reactContext
  }

  public constructor(context: Context) : super(null) {
    reactApplicationContext = null
    initDisplayMetricsIfNotInitialized(context)
    fontScale = context.resources.configuration.fontScale
  }

  override public fun getTypedExportedConstants(): Map<String, Any> {
    val displayMetrics = getDisplayMetricsWritableMap(fontScale.toDouble())

    // Cache the initial dimensions for later comparison in emitUpdateDimensionsEvent
    previousDisplayMetrics = displayMetrics.copy()
    return mapOf("Dimensions" to displayMetrics.toHashMap())
  }

  override fun onHostResume() {
    val newFontScale = reactApplicationContext?.resources?.configuration?.fontScale
    if (newFontScale != null && newFontScale != fontScale) {
      fontScale = newFontScale
      emitUpdateDimensionsEvent()
    }
  }

  override fun onHostPause(): Unit = Unit

  override fun onHostDestroy(): Unit = Unit

  public fun emitUpdateDimensionsEvent() {
    reactApplicationContext?.let { context ->
      if (context.hasActiveReactInstance()) {
        // Don't emit an event to JS if the dimensions haven't changed
        val displayMetrics = getDisplayMetricsWritableMap(fontScale.toDouble())
        if (previousDisplayMetrics == null) {
          previousDisplayMetrics = displayMetrics.copy()
        } else if (displayMetrics != previousDisplayMetrics) {
          previousDisplayMetrics = displayMetrics.copy()
          context.emitDeviceEvent("didUpdateDimensions", displayMetrics)
        }
      } else {
        ReactSoftExceptionLogger.logSoftException(
            NativeDeviceInfoSpec.NAME,
            ReactNoCrashSoftException(
                "No active CatalystInstance, cannot emitUpdateDimensionsEvent"))
      }
    }
  }

  override fun invalidate() {
    super.invalidate()
    reactApplicationContext?.removeLifecycleEventListener(this)
  }
}
