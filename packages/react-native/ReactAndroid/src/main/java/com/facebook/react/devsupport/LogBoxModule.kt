/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import com.facebook.fbreact.specs.NativeLogBoxSpec
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.SurfaceDelegate
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeLogBoxSpec.NAME)
public class LogBoxModule(
    reactContext: ReactApplicationContext?,
    private val devSupportManager: DevSupportManager
) : NativeLogBoxSpec(reactContext) {
  private val surfaceDelegate: SurfaceDelegate =
      devSupportManager.createSurfaceDelegate(NAME)
          ?: LogBoxDialogSurfaceDelegate(devSupportManager)

  override fun show() {
    UiThreadUtil.runOnUiThread {
      if (!surfaceDelegate.isContentViewReady()) {
        /**
         * LogBoxModule can be rendered in different surface. By default, it will use LogBoxDialog
         * to wrap the content of logs. In other platform (for example VR), a surfaceDelegate can be
         * provided so that the content can be wrapped in custom surface.
         */
        surfaceDelegate.createContentView("LogBox")
      }
      surfaceDelegate.show()
    }
  }

  override fun hide() {
    UiThreadUtil.runOnUiThread { surfaceDelegate.hide() }
  }

  override fun invalidate() {
    UiThreadUtil.runOnUiThread { surfaceDelegate.destroyContentView() }
  }

  public companion object {
    public const val NAME: String = "LogBox"
  }
}
