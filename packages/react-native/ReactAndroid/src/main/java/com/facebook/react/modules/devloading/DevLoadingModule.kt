/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.devloading

import com.facebook.fbreact.specs.NativeDevLoadingViewSpec
import com.facebook.react.bridge.JSExceptionHandler
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.module.annotations.ReactModule

/** [NativeModule] that allows JS to show dev loading view. */
@ReactModule(name = NativeDevLoadingViewSpec.NAME)
public class DevLoadingModule(reactContext: ReactApplicationContext) :
    NativeDevLoadingViewSpec(reactContext) {

  private val jsExceptionHandler: JSExceptionHandler? = reactContext.jsExceptionHandler
  private var devLoadingViewManager: DevLoadingViewManager? = null

  init {
    if (jsExceptionHandler != null && jsExceptionHandler is DevSupportManagerBase) {
      devLoadingViewManager = jsExceptionHandler.devLoadingViewManager
    }
  }

  public override fun showMessage(message: String, color: Double?, backgroundColor: Double?) {
    UiThreadUtil.runOnUiThread(Runnable { devLoadingViewManager?.showMessage(message) })
  }

  public override fun hide() {
    UiThreadUtil.runOnUiThread(Runnable { devLoadingViewManager?.hide() })
  }

  public companion object {
    public const val NAME: String = NativeDevLoadingViewSpec.NAME
  }
}
