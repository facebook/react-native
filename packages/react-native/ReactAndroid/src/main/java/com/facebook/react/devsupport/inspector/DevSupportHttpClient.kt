/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.devsupport.inspector

import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient

/**
 * Shared [OkHttpClient] instances for devsupport networking. Uses a single connection pool and
 * dispatcher across all dev support HTTP and WebSocket usage.
 */
internal object DevSupportHttpClient {
  /** Client for HTTP requests: connect=5s, write=disabled, read=disabled. */
  val httpClient: OkHttpClient =
      OkHttpClient.Builder()
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
