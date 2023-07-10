/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.jscexecutor

import com.facebook.react.bridge.JavaScriptExecutor
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.bridge.WritableNativeMap

class JSCExecutorFactory(private val appName: String, private val deviceName: String) :
    JavaScriptExecutorFactory {

  @Throws(Exception::class)
  override fun create(): JavaScriptExecutor {
    val jscConfig =
        WritableNativeMap().apply {
          putString("OwnerIdentity", "ReactNative")
          putString("AppIdentity", appName)
          putString("DeviceIdentity", deviceName)
        }
    return JSCExecutor(jscConfig)
  }

  override fun startSamplingProfiler() {
    throw UnsupportedOperationException("Starting sampling profiler not supported on ${toString()}")
  }

  override fun stopSamplingProfiler(filename: String) {
    throw UnsupportedOperationException("Stopping sampling profiler not supported on ${toString()}")
  }

  override fun toString(): String = "JSIExecutor+JSCRuntime"
}
