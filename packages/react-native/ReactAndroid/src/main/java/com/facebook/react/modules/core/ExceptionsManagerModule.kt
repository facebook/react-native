/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core

import com.facebook.common.logging.FLog
import com.facebook.fbreact.specs.NativeExceptionsManagerSpec
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.JavascriptException
import com.facebook.react.common.ReactConstants
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.util.ExceptionDataHelper.getExtraDataAsJson
import com.facebook.react.util.JSStackTrace.format

@ReactModule(name = NativeExceptionsManagerSpec.NAME)
public open class ExceptionsManagerModule(private val devSupportManager: DevSupportManager) :
    NativeExceptionsManagerSpec(null) {
  override fun reportFatalException(message: String?, stack: ReadableArray?, idDouble: Double) {
    val id = idDouble.toInt()
    val data = JavaOnlyMap()
    data.putString("message", message)
    data.putArray("stack", stack)
    data.putInt("id", id)
    data.putBoolean("isFatal", true)
    reportException(data)
  }

  override fun reportSoftException(message: String?, stack: ReadableArray?, idDouble: Double) {
    val id = idDouble.toInt()
    val data = JavaOnlyMap()
    data.putString("message", message)
    data.putArray("stack", stack)
    data.putInt("id", id)
    data.putBoolean("isFatal", false)
    reportException(data)
  }

  override fun reportException(data: ReadableMap) {
    val message = data.getString("message").orEmpty()
    val stack = data.getArray("stack") ?: Arguments.createArray()
    val isFatal = if (data.hasKey("isFatal")) data.getBoolean("isFatal") else false
    val extraDataAsJson = getExtraDataAsJson(data)
    if (isFatal) {
      val ex = JavascriptException(format(message, stack))
      ex.extraDataAsJson = extraDataAsJson
      throw ex
    } else {
      FLog.e(ReactConstants.TAG, format(message, stack))
      if (extraDataAsJson != null) {
        FLog.d(ReactConstants.TAG, "extraData: %s", extraDataAsJson)
      }
    }
  }

  override fun dismissRedbox() {
    if (devSupportManager.devSupportEnabled) {
      devSupportManager.hideRedboxDialog()
    }
  }

  public companion object {
    public const val NAME: String = NativeExceptionsManagerSpec.NAME
  }
}
