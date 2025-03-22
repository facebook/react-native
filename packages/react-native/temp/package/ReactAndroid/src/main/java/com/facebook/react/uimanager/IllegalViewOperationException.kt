/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.bridge.JSApplicationCausedNativeException

/** An exception caused by JS requesting the UI manager to perform an illegal view operation. */
public open class IllegalViewOperationException : JSApplicationCausedNativeException {
  private var view: View? = null

  public constructor(msg: String) : super(msg)

  public constructor(msg: String, view: View?, cause: Throwable) : super(msg, cause) {
    this.view = view
  }

  public fun getView(): View? = view
}
