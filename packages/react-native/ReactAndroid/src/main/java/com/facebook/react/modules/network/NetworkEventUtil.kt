/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.modules.network

import android.os.Bundle
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.buildReadableArray
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import java.net.SocketTimeoutException
import okhttp3.Headers
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response

/**
 * Utility class for reporting network lifecycle events to JavaScript and InspectorNetworkReporter.
 */
internal object NetworkEventUtil {
  @JvmStatic
  fun onCreateRequest(requestId: Int, request: Request) {
    if (ReactNativeFeatureFlags.enableNetworkEventReporting()) {
      val headersMap = okHttpHeadersToMap(request.headers())
      InspectorNetworkReporter.reportRequestStart(
          requestId,
          request.url().toString(),
          request.method(),
          headersMap,
          request.body()?.toString().orEmpty(),
          request.body()?.contentLength() ?: 0,
      )
      InspectorNetworkReporter.reportConnectionTiming(requestId, headersMap)
    }
  }

  @JvmStatic
  fun onDataSend(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      progress: Long,
      total: Long,
  ) {
    reactContext?.emitDeviceEvent(
        "didSendNetworkData",
        buildReadableArray {
          add(requestId)
          add(progress.toInt())
          add(total.toInt())
        },
    )
  }

  @JvmStatic
  fun onIncrementalDataReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      data: String?,
      progress: Long,
      total: Long,
  ) {
    if (ReactNativeFeatureFlags.enableNetworkEventReporting() && data != null) {
      InspectorNetworkReporter.reportDataReceived(requestId, data)
      InspectorNetworkReporter.maybeStoreResponseBodyIncremental(requestId, data)
    }
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkIncrementalData",
        buildReadableArray {
          add(requestId)
          add(data)
          add(progress.toInt())
          add(total.toInt())
        },
    )
  }

  @JvmStatic
  fun onDataReceivedProgress(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      progress: Long,
      total: Long,
  ) {
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkDataProgress",
        buildReadableArray {
          add(requestId)
          add(progress.toInt())
          add(total.toInt())
        },
    )
  }

  @JvmStatic
  fun onDataReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      data: String?,
      responseType: String,
  ) {
    if (ReactNativeFeatureFlags.enableNetworkEventReporting()) {
      InspectorNetworkReporter.maybeStoreResponseBody(
          requestId,
          data.orEmpty(),
          responseType == "base64",
      )
    }
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkData",
        buildReadableArray {
          add(requestId)
          add(data)
        },
    )
  }

  @JvmStatic
  fun onDataReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      data: WritableMap,
      rawData: ByteArray,
  ) {
    if (ReactNativeFeatureFlags.enableNetworkEventReporting()) {
      InspectorNetworkReporter.maybeStoreResponseBody(
          requestId,
          Base64.encodeToString(rawData, Base64.NO_WRAP),
          true,
      )
    }
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkData",
        Arguments.createArray().apply {
          pushInt(requestId)
          pushMap(data)
        },
    )
  }

  @JvmStatic
  fun onRequestError(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      error: String?,
      e: Throwable?,
  ) {
    if (ReactNativeFeatureFlags.enableNetworkEventReporting()) {
      InspectorNetworkReporter.reportRequestFailed(requestId, false)
    }
    reactContext?.emitDeviceEvent(
        "didCompleteNetworkResponse",
        buildReadableArray {
          add(requestId)
          add(error)
          if (e?.javaClass == SocketTimeoutException::class.java) {
            add(true) // last argument is a time out boolean
          }
        },
    )
  }

  @JvmStatic
  fun onRequestSuccess(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      encodedDataLength: Long,
  ) {
    if (ReactNativeFeatureFlags.enableNetworkEventReporting()) {
      InspectorNetworkReporter.reportResponseEnd(requestId, encodedDataLength)
    }
    reactContext?.emitDeviceEvent(
        "didCompleteNetworkResponse",
        buildReadableArray {
          add(requestId)
          addNull()
        },
    )
  }

  @JvmStatic
  fun onResponseReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      requestUrl: String?,
      response: Response,
  ) {
    val headersMap = okHttpHeadersToMap(response.headers())
    val headersBundle = Bundle()
    for ((headerName, headerValue) in headersMap) {
      headersBundle.putString(headerName, headerValue)
    }

    if (ReactNativeFeatureFlags.enableNetworkEventReporting()) {
      InspectorNetworkReporter.reportResponseStart(
          requestId,
          requestUrl.orEmpty(),
          response.code(),
          headersMap,
          response.body()?.contentLength() ?: 0,
      )
    }
    reactContext?.emitDeviceEvent(
        "didReceiveNetworkResponse",
        Arguments.createArray().apply {
          pushInt(requestId)
          pushInt(response.code())
          pushMap(Arguments.fromBundle(headersBundle))
          pushString(requestUrl)
        },
    )
  }

  @Deprecated("Compatibility overload")
  @JvmStatic
  fun onResponseReceived(
      reactContext: ReactApplicationContext?,
      requestId: Int,
      statusCode: Int,
      headers: WritableMap?,
      url: String?,
  ) {
    val headersBuilder = Headers.Builder()
    headers?.let { map ->
      val iterator = map.keySetIterator()
      while (iterator.hasNextKey()) {
        val key = iterator.nextKey()
        val value = map.getString(key)
        if (value != null) {
          headersBuilder.add(key, value)
        }
      }
    }
    onResponseReceived(
        reactContext,
        requestId,
        url,
        Response.Builder()
            .protocol(Protocol.HTTP_1_1)
            .request(Request.Builder().url(url.orEmpty()).build())
            .headers(headersBuilder.build())
            .code(statusCode)
            .message("")
            .build(),
    )
  }

  private fun okHttpHeadersToMap(headers: Headers): Map<String, String> {
    val responseHeaders = mutableMapOf<String, String>()
    for (i in 0 until headers.size()) {
      val headerName = headers.name(i)
      // multiple values for the same header
      if (responseHeaders.containsKey(headerName)) {
        responseHeaders[headerName] = "${responseHeaders[headerName]}, ${headers.value(i)}"
      } else {
        responseHeaders[headerName] = headers.value(i)
      }
    }
    return responseHeaders
  }
}
