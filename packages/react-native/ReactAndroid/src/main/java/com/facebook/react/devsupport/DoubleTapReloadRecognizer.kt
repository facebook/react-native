/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.View
import android.widget.EditText

/**
 * A class allows recognizing double key tap of "R", used to reload JS in [AbstractReactActivity],
 * [RedBoxDialogSurfaceDelegate] and [com.facebook.react.ReactActivity].
 */
public class DoubleTapReloadRecognizer {
  private var doRefresh = false

  public fun didDoubleTapR(keyCode: Int, view: View?): Boolean {
    if (keyCode == KeyEvent.KEYCODE_R && view !is EditText) {
      if (doRefresh) {
        doRefresh = false
        return true
      } else {
        doRefresh = true
        Handler(Looper.getMainLooper()).postDelayed({ doRefresh = false }, DOUBLE_TAP_DELAY)
      }
    }
    return false
  }

  private companion object {
    private const val DOUBLE_TAP_DELAY: Long = 200
  }
}
