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
import com.facebook.react.bridge.buildReadableArray
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
    reactContext?.emitDeviceEvent(
        "didSendNetworkData",
        buildReadableArray {
          add(requestId)
          add(progress.toInt())
          add(total.toInt())
        })
  }

  @JvmStatic
  fun onIncrementalDataReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      data: String?,
      progress: Long,
      total: Long
  ) {
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkIncrementalData",
        buildReadableArray {
          add(requestId)
          add(data)
          add(progress.toInt())
          add(total.toInt())
        })
  }

  @JvmStatic
  fun onDataReceivedProgress(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      progress: Long,
      total: Long
  ) {
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkDataProgress",
        buildReadableArray {
          add(requestId)
          add(progress.toInt())
          add(total.toInt())
        })
  }

  @JvmStatic
  fun onDataReceived(reactContext: ReactApplicationContext?, requestId: Int, data: String?) {
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkData",
        buildReadableArray {
          add(requestId)
          add(data)
        })
  }

  @JvmStatic
  fun onDataReceived(reactContext: ReactApplicationContext?, requestId: Int, data: WritableMap?) {
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkData",
        Arguments.createArray().apply {
          pushInt(requestId)
          pushMap(data)
        })
  }

  @JvmStatic
  fun onRequestError(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      error: String?,
      e: Throwable?
  ) {
    reactContext?.emitDeviceEvent(
        "didCompleteNetworkResponse",
        buildReadableArray {
          add(requestId)
          add(error)
          if (e?.javaClass == SocketTimeoutException::class.java) {
            add(true) // last argument is a time out boolean
          }
        })
  }

  @JvmStatic
  fun onRequestSuccess(reactContext: ReactApplicationContext?, requestId: Int) {
    reactContext?.emitDeviceEvent(
        "didCompleteNetworkResponse",
        buildReadableArray {
          add(requestId)
          addNull()
        })
  }

  @JvmStatic
  fun onResponseReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      statusCode: Int,
      headers: WritableMap?,
      url: String?
  ) {
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkResponse",
        Arguments.createArray().apply {
          pushInt(requestId)
          pushInt(statusCode)
          pushMap(headers)
          pushString(url)
        })
  }
}
