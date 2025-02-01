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

/**
 * Helper class that provides the same OkHttpClient instance that will be used for all networking
 * requests.
 */
public object OkHttpClientProvider {
  // Centralized OkHttpClient for all networking requests.
  internal var sClient: OkHttpClient? = null

  // User-provided OkHttpClient factory
  internal var sFactory: OkHttpClientFactory? = null

  public fun setOkHttpClientFactory(factory: OkHttpClientFactory?) {
    sFactory = factory
  }

  public fun getOkHttpClient(): OkHttpClient {
    return sClient ?: synchronized(this) { sClient ?: createClient().also { sClient = it } }
  }

  @JvmStatic
  public fun createClient(): OkHttpClient {
    return sFactory?.createNewNetworkModuleClient() ?: createClientBuilder().build()
  }

  @JvmStatic
  public fun createClient(context: Context): OkHttpClient {
    return sFactory?.createNewNetworkModuleClient() ?: createClientBuilder(context).build()
  }

  public fun createClientBuilder(): OkHttpClient.Builder {
    // No timeouts by default
    val client: OkHttpClient.Builder =
            OkHttpClient.Builder()
                    .connectTimeout(0, TimeUnit.MILLISECONDS)
                    .readTimeout(0, TimeUnit.MILLISECONDS)
                    .writeTimeout(0, TimeUnit.MILLISECONDS)
                    .cookieJar(ReactCookieJarContainer())

    return client
  }

  public fun createClientBuilder(context: Context): OkHttpClient.Builder {
    val cacheSize = 10 * 1024 * 1024 // 10 Mo
    return createClientBuilder(context, cacheSize)
  }

  public fun createClientBuilder(context: Context, cacheSize: Int): OkHttpClient.Builder {
    val client: OkHttpClient.Builder = createClientBuilder()

    if (cacheSize == 0) {
      return client
    }

    val cacheDirectory = File(context.cacheDir, "http-cache")
    val cache = Cache(cacheDirectory, cacheSize.toLong())

    return client.cache(cache)
  }
}
