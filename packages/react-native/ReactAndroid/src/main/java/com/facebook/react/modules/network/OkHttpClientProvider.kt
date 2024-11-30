/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import android.content.Context
import java.io.File
import java.util.concurrent.TimeUnit
import okhttp3.Cache
import okhttp3.OkHttpClient
import okhttp3.OkHttpClient.Builder

/**
 * Helper class that provides the same OkHttpClient instance that will be used for all networking
 * requests.
 */
public object OkHttpClientProvider {

  // Centralized OkHttpClient for all networking requests.
  private val _okHttpClient: OkHttpClient by lazy(LazyThreadSafetyMode.NONE) { createClient() }

  @JvmStatic
  public fun getOkHttpClient(): OkHttpClient {
    return _okHttpClient
  }

  // User-provided OkHttpClient factory
  private var _factory: OkHttpClientFactory? = null

  @JvmStatic
  public fun setOkHttpClientFactory(factory: OkHttpClientFactory) {
    _factory = factory
  }

  @JvmStatic
  public fun createClient(): OkHttpClient {
    _factory?.let {
      return it.createNewNetworkModuleClient()
    }
    return createClientBuilder().build()
  }

  @JvmStatic
  public fun createClient(context: Context): OkHttpClient {
    _factory?.let {
      return it.createNewNetworkModuleClient()
    }
    return createClientBuilder(context).build()
  }

  @JvmStatic
  public fun createClientBuilder(): OkHttpClient.Builder {
    // No timeouts by default
    return OkHttpClient.Builder()
        .connectTimeout(0, TimeUnit.MILLISECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .writeTimeout(0, TimeUnit.MILLISECONDS)
        .cookieJar(ReactCookieJarContainer())
  }

  @JvmStatic
  public fun createClientBuilder(context: Context): OkHttpClient.Builder {
    val cacheSize = 10 * 1_024 * 1_024 // 10 Mo
    return createClientBuilder(context, cacheSize)
  }

  @JvmStatic
  public fun createClientBuilder(context: Context, cacheSize: Int): OkHttpClient.Builder {
    val client = createClientBuilder()
    if (cacheSize == 0) {
      return client
    }
    val cacheDirectory = File(context.cacheDir, "http-cache")
    val cache = Cache(cacheDirectory, cacheSize.toLong())
    return client.cache(cache)
  }
}
