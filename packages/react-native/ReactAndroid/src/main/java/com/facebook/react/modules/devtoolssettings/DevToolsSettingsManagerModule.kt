/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.devtoolssettings

import android.content.Context
import android.content.SharedPreferences
import com.facebook.fbreact.specs.NativeDevToolsSettingsManagerSpec
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeDevToolsSettingsManagerSpec.NAME)
public class DevToolsSettingsManagerModule(reactContext: ReactApplicationContext) :
    NativeDevToolsSettingsManagerSpec(reactContext) {

  private val sharedPreferences: SharedPreferences =
      reactContext.getSharedPreferences(SHARED_PREFERENCES_PREFIX, Context.MODE_PRIVATE)

  public override fun getConsolePatchSettings(): String? =
      sharedPreferences.getString(KEY_CONSOLE_PATCH_SETTINGS, null)

  public override fun setConsolePatchSettings(newSettings: String?): Unit =
      sharedPreferences.edit().putString(KEY_CONSOLE_PATCH_SETTINGS, newSettings).apply()

  public override fun getProfilingSettings(): String? =
      sharedPreferences.getString(KEY_PROFILING_SETTINGS, null)

  public override fun setProfilingSettings(newSettings: String?): Unit =
      sharedPreferences.edit().putString(KEY_PROFILING_SETTINGS, newSettings).apply()

  private companion object {
    private const val SHARED_PREFERENCES_PREFIX = "ReactNative__DevToolsSettings"
    private const val KEY_CONSOLE_PATCH_SETTINGS = "ConsolePatchSettings"
    private const val KEY_PROFILING_SETTINGS = "ProfilingSettings"
  }
}
