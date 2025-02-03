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
internal object ResponseUtil {
  @JvmStatic
  fun onDataSend(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      progress: Long,
      total: Long
  ) {
    val args =
        Arguments.createArray().apply {
          pushInt(requestId)
          pushInt(progress.toInt())
          pushInt(total.toInt())
        }

    reactContext?.emitDeviceEvent("didSendNetworkData", args)
  }

  @JvmStatic
  fun onIncrementalDataReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      data: String?,
      progress: Long,
      total: Long
  ) {
    val args =
        Arguments.createArray().apply {
          pushInt(requestId)
          pushString(data)
          pushInt(progress.toInt())
          pushInt(total.toInt())
        }

    reactContext?.emitDeviceEvent("didReceiveNetworkIncrementalData", args)
  }

  @JvmStatic
  fun onDataReceivedProgress(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      progress: Long,
      total: Long
  ) {
    val args =
        Arguments.createArray().apply {
          pushInt(requestId)
          pushInt(progress.toInt())
          pushInt(total.toInt())
        }

    reactContext?.emitDeviceEvent("didReceiveNetworkDataProgress", args)
  }

  @JvmStatic
  fun onDataReceived(reactContext: ReactApplicationContext?, requestId: Int, data: String?) {
    val args =
        Arguments.createArray().apply {
          pushInt(requestId)
          pushString(data)
        }

    reactContext?.emitDeviceEvent("didReceiveNetworkData", args)
  }

  @JvmStatic
  fun onDataReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      data: WritableMap?
  ) {
    val args =
        Arguments.createArray().apply {
          pushInt(requestId)
          pushMap(data)
        }

    reactContext?.emitDeviceEvent("didReceiveNetworkData", args)
  }

  @JvmStatic
  fun onRequestError(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      error: String?,
      e: Throwable?
  ) {
    val args =
        Arguments.createArray().apply {
          pushInt(requestId)
          pushString(error)
        }

    if ((e != null) && (e.javaClass == SocketTimeoutException::class.java)) {
      args.pushBoolean(true) // last argument is a time out boolean
    }

    reactContext?.emitDeviceEvent("didCompleteNetworkResponse", args)
  }

  @JvmStatic
  fun onRequestSuccess(reactContext: ReactApplicationContext?, requestId: Int) {
    val args =
        Arguments.createArray().apply {
          pushInt(requestId)
          pushNull()
        }

    reactContext?.emitDeviceEvent("didCompleteNetworkResponse", args)
  }

  @JvmStatic
  fun onResponseReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      statusCode: Int,
      headers: WritableMap?,
      url: String?
  ) {
    val args =
        Arguments.createArray().apply {
          pushInt(requestId)
          pushInt(statusCode)
          pushMap(headers)
          pushString(url)
        }

    reactContext?.emitDeviceEvent("didReceiveNetworkResponse", args)
  }
}
