/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.devsupport.inspector

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import okhttp3.Interceptor
import okhttp3.OkHttpClient

/**
 * Shared [OkHttpClient] instances for devsupport networking. Uses a single connection pool and
 * dispatcher across all dev support HTTP and WebSocket usage. Supports injecting custom request
 * headers that are applied to every outgoing request via an OkHttp interceptor.
 */
public object DevSupportHttpClient {
  private val customHeaders = ConcurrentHashMap<String, String>()

  private val headerInterceptor = Interceptor { chain ->
    val builder = chain.request().newBuilder()
    for ((name, value) in customHeaders) {
      builder.header(name, value)
    }
    chain.proceed(builder.build())
  }

  /** Client for HTTP requests: connect=5s, write=disabled, read=disabled. */
  public val httpClient: OkHttpClient =
      OkHttpClient.Builder()
          .addInterceptor(headerInterceptor)
          .connectTimeout(5, TimeUnit.SECONDS)
          .writeTimeout(0, TimeUnit.MILLISECONDS)
          .readTimeout(0, TimeUnit.MINUTES)
          .build()

  /** Client for WebSocket connections: connect=10s, write=10s, read=disabled. */
  public val websocketClient: OkHttpClient =
      httpClient
          .newBuilder()
          .connectTimeout(10, TimeUnit.SECONDS)
          .writeTimeout(10, TimeUnit.SECONDS)
          .build()

  /** Add a custom header to be included in all requests made through both clients. */
  @JvmStatic
  public fun addRequestHeader(name: String, value: String) {
    customHeaders[name] = value
  }

  /** Remove a previously added custom header. */
  @JvmStatic
  public fun removeRequestHeader(name: String) {
    customHeaders.remove(name)
  }
}
