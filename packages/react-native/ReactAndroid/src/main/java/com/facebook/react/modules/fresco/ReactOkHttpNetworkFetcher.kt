/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.fresco

import android.os.SystemClock
import com.facebook.imagepipeline.backends.okhttp3.OkHttpNetworkFetcher
import com.facebook.imagepipeline.producers.NetworkFetcher
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.network.OkHttpCompat
import okhttp3.CacheControl
import okhttp3.OkHttpClient
import okhttp3.Request

internal class ReactOkHttpNetworkFetcher(private val okHttpClient: OkHttpClient) :
    OkHttpNetworkFetcher(okHttpClient) {
  private fun getHeaders(readableMap: ReadableMap?): Map<String, String>? {
    if (readableMap == null) {
      return null
    }
    val iterator = readableMap.keySetIterator()
    val map: MutableMap<String, String> = HashMap()
    while (iterator.hasNextKey()) {
      val key = iterator.nextKey()
      readableMap.getString(key)?.let { map[key] = it }
    }
    return map
  }

  override fun fetch(fetchState: OkHttpNetworkFetchState, callback: NetworkFetcher.Callback) {
    fetchState.submitTime = SystemClock.elapsedRealtime()
    val uri = fetchState.uri
    var requestHeaders: Map<String, String>? = null
    if (fetchState.context.imageRequest is ReactNetworkImageRequest) {
      val networkImageRequest = fetchState.context.imageRequest as ReactNetworkImageRequest
      requestHeaders = getHeaders(networkImageRequest.headers)
    }
    val headers = OkHttpCompat.getHeadersFromMap(requestHeaders)
    val request =
        Request.Builder()
            .cacheControl(CacheControl.Builder().noStore().build())
            .url(uri.toString())
            .headers(headers)
            .get()
            .build()
    fetchWithRequest(fetchState, callback, request)
  }

  private companion object {
    private const val TAG = "ReactOkHttpNetworkFetcher"
  }
}
