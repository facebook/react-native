/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.devsupport

import android.content.Context
import android.content.SharedPreferences
import android.content.SharedPreferences.OnSharedPreferenceChangeListener
import android.preference.PreferenceManager
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.packagerconnection.PackagerConnectionSettings

/**
 * Helper class for accessing developers settings that can not be accessed outside of the package
 * [com.facebook.react.devsupport]. For accessing some of the settings by external modules this
 * class implements an external interface [DeveloperSettings].
 */
internal class DevInternalSettings(applicationContext: Context, private val listener: Listener?) :
    DeveloperSettings, OnSharedPreferenceChangeListener {
  private val preferences: SharedPreferences =
      PreferenceManager.getDefaultSharedPreferences(applicationContext)
  val packagerConnectionSettings: PackagerConnectionSettings

  init {
    preferences.registerOnSharedPreferenceChangeListener(this)
    packagerConnectionSettings = PackagerConnectionSettings(applicationContext)
  }

  override fun isFpsDebugEnabled(): Boolean = preferences.getBoolean(PREFS_FPS_DEBUG_KEY, false)

  override fun isAnimationFpsDebugEnabled(): Boolean =
      preferences.getBoolean(PREFS_ANIMATIONS_DEBUG_KEY, false)

  override fun isJSDevModeEnabled(): Boolean =
      preferences.getBoolean(PREFS_JS_DEV_MODE_DEBUG_KEY, true)

  override fun isJSMinifyEnabled(): Boolean =
      preferences.getBoolean(PREFS_JS_MINIFY_DEBUG_KEY, false)

  override fun onSharedPreferenceChanged(sharedPreferences: SharedPreferences, key: String?) {
    if (listener != null) {
      if (PREFS_FPS_DEBUG_KEY == key ||
          PREFS_JS_DEV_MODE_DEBUG_KEY == key ||
          PREFS_START_SAMPLING_PROFILER_ON_INIT == key ||
          PREFS_JS_MINIFY_DEBUG_KEY == key) {
        listener.onInternalSettingsChanged()
      }
    }
  }

  override fun isElementInspectorEnabled(): Boolean =
      preferences.getBoolean(PREFS_INSPECTOR_DEBUG_KEY, false)

  override fun isDeviceDebugEnabled(): Boolean = ReactBuildConfig.DEBUG

  override fun isRemoteJSDebugEnabled(): Boolean =
      preferences.getBoolean(PREFS_REMOTE_JS_DEBUG_KEY, false)

  override fun setRemoteJSDebugEnabled(remoteJSDebugEnabled: Boolean) {
    preferences.edit().putBoolean(PREFS_REMOTE_JS_DEBUG_KEY, remoteJSDebugEnabled).apply()
  }

  override fun isStartSamplingProfilerOnInit(): Boolean =
      preferences.getBoolean(PREFS_START_SAMPLING_PROFILER_ON_INIT, false)

  // Not supported.
  override fun addMenuItem(title: String) = Unit

  fun setElementInspectorEnabled(enabled: Boolean) {
    preferences.edit().putBoolean(PREFS_INSPECTOR_DEBUG_KEY, enabled).apply()
  }

  var isHotModuleReplacementEnabled: Boolean
    get() = preferences.getBoolean(PREFS_HOT_MODULE_REPLACEMENT_KEY, true)
    set(enabled) {
      preferences.edit().putBoolean(PREFS_HOT_MODULE_REPLACEMENT_KEY, enabled).apply()
    }

  fun setJSDevModeEnabled(value: Boolean) {
    preferences.edit().putBoolean(PREFS_JS_DEV_MODE_DEBUG_KEY, value).apply()
  }

  fun setFpsDebugEnabled(enabled: Boolean) {
    preferences.edit().putBoolean(PREFS_FPS_DEBUG_KEY, enabled).apply()
  }

  interface Listener {
    fun onInternalSettingsChanged()
  }

  companion object {
    private const val PREFS_FPS_DEBUG_KEY = "fps_debug"
    private const val PREFS_JS_DEV_MODE_DEBUG_KEY = "js_dev_mode_debug"
    private const val PREFS_JS_MINIFY_DEBUG_KEY = "js_minify_debug"
    private const val PREFS_ANIMATIONS_DEBUG_KEY = "animations_debug"
    private const val PREFS_INSPECTOR_DEBUG_KEY = "inspector_debug"
    private const val PREFS_HOT_MODULE_REPLACEMENT_KEY = "hot_module_replacement"
    private const val PREFS_REMOTE_JS_DEBUG_KEY = "remote_js_debug"
    private const val PREFS_START_SAMPLING_PROFILER_ON_INIT = "start_sampling_profiler_on_init"
  }
}
