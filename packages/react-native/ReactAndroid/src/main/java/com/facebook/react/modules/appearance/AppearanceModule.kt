/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.appearance

import android.content.Context
import android.content.res.Configuration
import androidx.appcompat.app.AppCompatDelegate
import com.facebook.fbreact.specs.NativeAppearanceSpec
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule

/** Module that exposes the user's preferred color scheme. */
@ReactModule(name = NativeAppearanceSpec.NAME)
public class AppearanceModule
@JvmOverloads
constructor(
    reactContext: ReactApplicationContext,
    private val overrideColorScheme: OverrideColorScheme? = null
) : NativeAppearanceSpec(reactContext) {

  private var lastEmittedColorScheme: String? = null

  /** Optional override to the current color scheme */
  public fun interface OverrideColorScheme {
    /**
     * Color scheme will use the return value instead of the current system configuration. Available
     * scheme: {light, dark}
     */
    public fun getScheme(): String
  }

  private fun colorSchemeForCurrentConfiguration(context: Context): String {
    if (overrideColorScheme != null) {
      return overrideColorScheme.getScheme()
    }

    val currentNightMode =
        context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
    return when (currentNightMode) {
      Configuration.UI_MODE_NIGHT_NO -> "light"
      Configuration.UI_MODE_NIGHT_YES -> "dark"
      else -> "light"
    }
  }

  public override fun getColorScheme(): String {
    // Attempt to use the Activity context first in order to get the most up to date
    // scheme. This covers the scenario when AppCompatDelegate.setDefaultNightMode()
    // is called directly (which can occur in Brownfield apps for example).
    val activity = getCurrentActivity()
    return colorSchemeForCurrentConfiguration(activity ?: getReactApplicationContext())
  }

  public override fun setColorScheme(style: String) {
    UiThreadUtil.runOnUiThread {
      when (style) {
        "dark" -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
        "light" -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
        "unspecified" ->
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)
      }
    }
  }

  /** Stub */
  public override fun addListener(eventName: String): Unit = Unit

  /** Stub */
  public override fun removeListeners(count: Double): Unit = Unit

  /*
   * Call this from your root activity whenever configuration changes. If the
   * color scheme has changed, an event will emitted.
   */
  public fun onConfigurationChanged(currentContext: Context) {
    val newColorScheme = colorSchemeForCurrentConfiguration(currentContext)
    if (lastEmittedColorScheme != newColorScheme) {
      lastEmittedColorScheme = newColorScheme
      emitAppearanceChanged(newColorScheme)
    }
  }

  /** Sends an event to the JS instance that the preferred color scheme has changed. */
  public fun emitAppearanceChanged(colorScheme: String) {
    val appearancePreferences = Arguments.createMap()
    appearancePreferences.putString("colorScheme", colorScheme)
    val reactApplicationContext = getReactApplicationContextIfActiveOrWarn()
    reactApplicationContext?.emitDeviceEvent(APPEARANCE_CHANGED_EVENT_NAME, appearancePreferences)
  }

  public companion object {
    public const val NAME: String = NativeAppearanceSpec.NAME
    private const val APPEARANCE_CHANGED_EVENT_NAME = "appearanceChanged"
  }
}
