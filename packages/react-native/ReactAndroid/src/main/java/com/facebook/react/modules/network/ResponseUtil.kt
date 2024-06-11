/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import java.net.SocketTimeoutException

/** Util methods to send network responses to JS. */
public object ResponseUtil {

  @JvmStatic
  public fun onDataSend(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      progress: Long,
      total: Long
  ) {
    val args = Arguments.createArray()
    args.pushInt(requestId)
    args.pushInt(progress.toInt())
    args.pushInt(total.toInt())
    reactContext?.emitDeviceEvent("didSendNetworkData", args)
  }

  @JvmStatic
  public fun onIncrementalDataReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      data: String?,
      progress: Long,
      total: Long
  ) {
    val args = Arguments.createArray()
    args.pushInt(requestId)
    args.pushString(data)
    args.pushInt(progress.toInt())
    args.pushInt(total.toInt())
    reactContext?.emitDeviceEvent("didReceiveNetworkIncrementalData", args)
  }

  @JvmStatic
  public fun onDataReceivedProgress(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      progress: Long,
      total: Long
  ) {
    val args = Arguments.createArray()
    args.pushInt(requestId)
    args.pushInt(progress.toInt())
    args.pushInt(total.toInt())
    reactContext?.emitDeviceEvent("didReceiveNetworkDataProgress", args)
  }

  @JvmStatic
  public fun onDataReceived(reactContext: ReactApplicationContext?, requestId: Int, data: String?) {
    val args = Arguments.createArray()
    args.pushInt(requestId)
    args.pushString(data)
    reactContext?.emitDeviceEvent("didReceiveNetworkData", args)
  }

  @JvmStatic
  public fun onDataReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      data: WritableMap?
  ) {
    val args = Arguments.createArray()
    args.pushInt(requestId)
    args.pushMap(data)
    reactContext?.emitDeviceEvent("didReceiveNetworkData", args)
  }

  @JvmStatic
  public fun onRequestError(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      error: String?,
      e: Throwable?
  ) {
    val args = Arguments.createArray()
    args.pushInt(requestId)
    args.pushString(error)
    if (e != null && e.javaClass == SocketTimeoutException::class.java) {
      args.pushBoolean(true) // last argument is a time out boolean
    }
    reactContext?.emitDeviceEvent("didCompleteNetworkResponse", args)
  }

  @JvmStatic
  public fun onRequestSuccess(reactContext: ReactApplicationContext?, requestId: Int) {
    val args = Arguments.createArray()
    args.pushInt(requestId)
    args.pushNull()
    reactContext?.emitDeviceEvent("didCompleteNetworkResponse", args)
  }

  @JvmStatic
  public fun onResponseReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      statusCode: Int,
      headers: WritableMap?,
      url: String?
  ) {
    val args = Arguments.createArray()
    args.pushInt(requestId)
    args.pushInt(statusCode)
    args.pushMap(headers)
    args.pushString(url)
    reactContext?.emitDeviceEvent("didReceiveNetworkResponse", args)
  }
}
