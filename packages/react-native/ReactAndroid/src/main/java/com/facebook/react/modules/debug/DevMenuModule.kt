/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.debug

import com.facebook.fbreact.specs.NativeDevMenuSpec
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.module.annotations.ReactModule

/** Module that exposes the DevMenu to JS so that it can be used to programmatically open it. */
@ReactModule(name = NativeDevMenuSpec.NAME)
internal class DevMenuModule(
    reactContext: ReactApplicationContext?,
    private val devSupportManager: DevSupportManager
) : NativeDevMenuSpec(reactContext) {

  override fun show() {
    if (devSupportManager.devSupportEnabled) {
      devSupportManager.showDevOptionsDialog()
    }
  }

  override fun reload() {
    if (devSupportManager.devSupportEnabled) {
      UiThreadUtil.runOnUiThread { devSupportManager.handleReloadJS() }
    }
  }

  override fun setProfilingEnabled(enabled: Boolean) {
    // iOS only
  }

  override fun setHotLoadingEnabled(enabled: Boolean) {
    devSupportManager.setHotModuleReplacementEnabled(enabled)
  }

  companion object {
    const val NAME: String = NativeDevMenuSpec.NAME
  }
}
