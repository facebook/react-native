/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.deviceinfo

import android.util.DisplayMetrics
import androidx.window.layout.WindowMetricsCalculator
import com.facebook.fbreact.specs.NativeDeviceInfoSpec
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.DisplayMetricsHolder.initDisplayMetricsIfNotInitialized
import com.facebook.react.views.view.isEdgeToEdgeFeatureFlagOn

/** Module that exposes Android Constants to JS. */
@ReactModule(name = NativeDeviceInfoSpec.NAME)
internal class DeviceInfoModule(reactContext: ReactApplicationContext) :
    NativeDeviceInfoSpec(reactContext), LifecycleEventListener {
  private var fontScale: Float = reactContext.resources.configuration.fontScale
  private var previousDisplayMetrics: ReadableMap? = null

  init {
    initDisplayMetricsIfNotInitialized(reactContext)
    reactContext.addLifecycleEventListener(this)
  }

  /** The metrics of the window associated to the Context used to initialize ReactNative */
  private fun getWindowDisplayMetrics(): DisplayMetrics {
    val displayMetrics = reactApplicationContext.resources.displayMetrics
    val windowDisplayMetrics = DisplayMetrics()
    windowDisplayMetrics.setTo(displayMetrics)

    if (isEdgeToEdgeFeatureFlagOn) {
      reactApplicationContext.currentActivity?.let { activity ->
        WindowMetricsCalculator.getOrCreate().computeCurrentWindowMetrics(activity).let {
          windowDisplayMetrics.widthPixels = it.bounds.width()
          windowDisplayMetrics.heightPixels = it.bounds.height()
        }
      }
    }

    return windowDisplayMetrics
  }

  fun getDisplayMetricsWritableMap(): WritableMap =
      WritableNativeMap().apply {
        putMap(
            "windowPhysicalPixels",
            getPhysicalPixelsWritableMap(getWindowDisplayMetrics()),
        )
        putMap(
            "screenPhysicalPixels",
            getPhysicalPixelsWritableMap(DisplayMetricsHolder.getScreenDisplayMetrics()),
        )
      }

  private fun getPhysicalPixelsWritableMap(
      displayMetrics: DisplayMetrics,
  ): WritableMap =
      WritableNativeMap().apply {
        putInt("width", displayMetrics.widthPixels)
        putInt("height", displayMetrics.heightPixels)
        putDouble("scale", displayMetrics.density.toDouble())
        putDouble("fontScale", fontScale.toDouble())
        putDouble("densityDpi", displayMetrics.densityDpi.toDouble())
      }

  public override fun getTypedExportedConstants(): Map<String, Any> {
    val displayMetrics = getDisplayMetricsWritableMap()

    // Cache the initial dimensions for later comparison in emitUpdateDimensionsEvent
    previousDisplayMetrics = displayMetrics.copy()

    return mapOf(
        "Dimensions" to displayMetrics.toHashMap(),
        "isEdgeToEdge" to isEdgeToEdgeFeatureFlagOn,
    )
  }

  override fun onHostResume() {
    val newFontScale = reactApplicationContext.resources?.configuration?.fontScale
    if (newFontScale != null && newFontScale != fontScale) {
      fontScale = newFontScale
      emitUpdateDimensionsEvent()
    }
  }

  override fun onHostPause(): Unit = Unit

  override fun onHostDestroy(): Unit = Unit

  fun emitUpdateDimensionsEvent() {
    reactApplicationContext.let { context ->
      if (context.hasActiveReactInstance()) {
        // Don't emit an event to JS if the dimensions haven't changed
        val displayMetrics = getDisplayMetricsWritableMap()
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
                "No active CatalystInstance, cannot emitUpdateDimensionsEvent"
            ),
        )
      }
    }
  }

  override fun invalidate() {
    super.invalidate()
    reactApplicationContext.removeLifecycleEventListener(this)
  }

  companion object {
    const val NAME: String = NativeDeviceInfoSpec.NAME
  }
}
