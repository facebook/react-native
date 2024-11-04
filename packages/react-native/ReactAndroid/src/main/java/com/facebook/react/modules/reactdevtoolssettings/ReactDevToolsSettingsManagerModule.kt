/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.reactdevtoolssettings

import android.content.Context
import android.content.SharedPreferences
import com.facebook.fbreact.specs.NativeReactDevToolsSettingsManagerSpec
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeReactDevToolsSettingsManagerSpec.NAME)
internal class ReactDevToolsSettingsManagerModule(reactContext: ReactApplicationContext) :
    NativeReactDevToolsSettingsManagerSpec(reactContext) {

  private val sharedPreferences: SharedPreferences =
      reactContext.getSharedPreferences(SHARED_PREFERENCES_PREFIX, Context.MODE_PRIVATE)

  override fun setGlobalHookSettings(settings: String): Unit =
      sharedPreferences.edit().putString(KEY_HOOK_SETTINGS, settings).apply()

  override fun getGlobalHookSettings(): String? =
      sharedPreferences.getString(KEY_HOOK_SETTINGS, null)

  companion object {
    const val NAME: String = NativeReactDevToolsSettingsManagerSpec.NAME
    private const val SHARED_PREFERENCES_PREFIX = "ReactNative__DevToolsSettings"
    private const val KEY_HOOK_SETTINGS = "HookSettings"
  }
}
