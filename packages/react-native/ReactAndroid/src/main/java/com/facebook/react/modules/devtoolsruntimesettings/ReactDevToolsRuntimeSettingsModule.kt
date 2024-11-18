/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.devtoolsruntimesettings

import com.facebook.fbreact.specs.NativeReactDevToolsRuntimeSettingsModuleSpec
import com.facebook.jni.annotations.DoNotStripAny
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule

private class Settings {
  var shouldReloadAndProfile: Boolean = false
  var recordChangeDescriptions: Boolean = false
}

@DoNotStripAny
@ReactModule(name = NativeReactDevToolsRuntimeSettingsModuleSpec.NAME)
internal class ReactDevToolsRuntimeSettingsModule(reactContext: ReactApplicationContext?) :
    NativeReactDevToolsRuntimeSettingsModuleSpec(reactContext) {

  companion object {
    // static to persist across Turbo Module reloads
    private val settings = Settings()
    const val NAME: String = NativeReactDevToolsRuntimeSettingsModuleSpec.NAME
  }

  override fun setReloadAndProfileConfig(map: ReadableMap) {
    if (map.hasKey("shouldReloadAndProfile")) {
      settings.shouldReloadAndProfile = map.getBoolean("shouldReloadAndProfile")
    }
    if (map.hasKey("recordChangeDescriptions")) {
      settings.recordChangeDescriptions = map.getBoolean("recordChangeDescriptions")
    }
  }

  override fun getReloadAndProfileConfig(): WritableMap {
    val map = Arguments.createMap()
    map.putBoolean("shouldReloadAndProfile", settings.shouldReloadAndProfile)
    map.putBoolean("recordChangeDescriptions", settings.recordChangeDescriptions)
    return map
  }
}
