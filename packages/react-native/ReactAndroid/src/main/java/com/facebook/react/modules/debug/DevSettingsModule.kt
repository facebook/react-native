/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.debug

import com.facebook.fbreact.specs.NativeDevSettingsSpec
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.module.annotations.ReactModule

/**
 * Module that exposes the URL to the source code map (used for exception stack trace parsing) to JS
 */
@ReactModule(name = NativeDevSettingsSpec.NAME)
public class DevSettingsModule(
    reactContext: ReactApplicationContext?,
    private val devSupportManager: DevSupportManager
) : NativeDevSettingsSpec(reactContext) {
  override fun reload() {
    if (devSupportManager.devSupportEnabled) {
      UiThreadUtil.runOnUiThread { devSupportManager.handleReloadJS() }
    }
  }

  override fun reloadWithReason(reason: String) {
    reload()
  }

  override fun onFastRefresh() {
    // noop
  }

  override fun setHotLoadingEnabled(isHotLoadingEnabled: Boolean) {
    devSupportManager.setHotModuleReplacementEnabled(isHotLoadingEnabled)
  }

  override fun setProfilingEnabled(isProfilingEnabled: Boolean) {
    devSupportManager.setFpsDebugEnabled(isProfilingEnabled)
  }

  override fun toggleElementInspector() {
    devSupportManager.toggleElementInspector()
  }

  override fun addMenuItem(title: String) {
    devSupportManager.addCustomDevOption(title) {
      val data = Arguments.createMap()
      data.putString("title", title)
      val reactApplicationContext = reactApplicationContextIfActiveOrWarn
      reactApplicationContext?.emitDeviceEvent("didPressMenuItem", data)
    }
  }

  override fun openDebugger() {
    devSupportManager.openDebugger()
  }

  override fun setIsShakeToShowDevMenuEnabled(enabled: Boolean) {
    // iOS only
  }

  override fun addListener(eventName: String) {
    // iOS only
  }

  override fun removeListeners(count: Double) {
    // iOS only
  }

  public companion object {
    public const val NAME: String = NativeDevSettingsSpec.NAME
  }
}
