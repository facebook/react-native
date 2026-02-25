/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.devsupport.inspector

import com.facebook.react.devsupport.interfaces.DevSupportRequestHeaders
import java.util.concurrent.TimeUnit
import okhttp3.Interceptor
import okhttp3.OkHttpClient

/**
 * Shared [OkHttpClient] instances for devsupport networking. Uses a single connection pool and
 * dispatcher across all dev support HTTP and WebSocket usage. Injects custom request headers
 * registered via [DevSupportRequestHeaders] into every outgoing request.
 */
internal object DevSupportHttpClient {
  private val headerInterceptor = Interceptor { chain ->
    val originalRequest = chain.request()
    val headers = DevSupportRequestHeaders.allHeaders()
    if (headers.isEmpty()) {
      chain.proceed(originalRequest)
    } else {
      val builder = originalRequest.newBuilder()
      for ((name, value) in headers) {
        builder.header(name, value)
      }
      chain.proceed(builder.build())
    }
  }

  /** Client for HTTP requests: connect=5s, write=disabled, read=disabled. */
  val httpClient: OkHttpClient =
      OkHttpClient.Builder()
          .addInterceptor(headerInterceptor)
          .connectTimeout(5, TimeUnit.SECONDS)
          .writeTimeout(0, TimeUnit.MILLISECONDS)
          .readTimeout(0, TimeUnit.MINUTES)
          .build()

  /** Client for WebSocket connections: connect=10s, write=10s, read=disabled. */
  val websocketClient: OkHttpClient =
      httpClient
          .newBuilder()
          .connectTimeout(10, TimeUnit.SECONDS)
          .writeTimeout(10, TimeUnit.SECONDS)
          .build()
}
