/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.common.logging.FLog
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import java.lang.reflect.Method

@DoNotStrip
@LegacyArchitecture
public object ReactCxxErrorHandler {
  init {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "ReactCxxErrorHandler", LegacyArchitectureLogLevel.WARNING)
  }

  private var handleErrorFunc: Method? = null
  private var handlerObject: Any? = null

  @DoNotStrip
  @JvmStatic
  public fun setHandleErrorFunc(handlerObject: Any?, handleErrorFunc: Method?) {
    this.handlerObject = handlerObject
    this.handleErrorFunc = handleErrorFunc
  }

  @DoNotStrip
  @JvmStatic
  // For use from within the C++ JReactCxxErrorHandler
  private fun handleError(message: String) {
    handleErrorFunc?.let {
      try {
        val parameters = arrayOf<Any>(Exception(message))
        it.invoke(handlerObject, parameters)
      } catch (e: Exception) {
        FLog.e("ReactCxxErrorHandler", "Failed to invoke error handler function", e)
      }
    }
  }
}
