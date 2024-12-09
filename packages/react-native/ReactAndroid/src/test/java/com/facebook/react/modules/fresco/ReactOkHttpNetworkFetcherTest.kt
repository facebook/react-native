/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Conflicting okhttp versions
@file:Suppress("DEPRECATION_ERROR")

package com.facebook.react.modules.fresco

import android.net.Uri
import com.facebook.imagepipeline.backends.okhttp3.OkHttpNetworkFetcher
import com.facebook.imagepipeline.producers.NetworkFetcher
import com.facebook.imagepipeline.producers.ProducerContext
import java.util.concurrent.ExecutorService
import okhttp3.Dispatcher
import okhttp3.OkHttpClient
import okhttp3.Request
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentCaptor
import org.mockito.Captor
import org.mockito.Mockito.any
import org.mockito.Mockito.mock
import org.mockito.Mockito.spy
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when` as whenever
import org.robolectric.RobolectricTestRunner

/**
 * Returns Mockito.any() as nullable type to avoid java.lang.IllegalStateException when null is
 * returned.
 */
private fun <T> anyOrNull(type: Class<T>): T = any(type)

/**
 * Returns ArgumentCaptor.capture() as nullable type to avoid java.lang.IllegalStateException when
 * null is returned.
 */
fun <T> capture(argumentCaptor: ArgumentCaptor<T>): T = argumentCaptor.capture()

@RunWith(RobolectricTestRunner::class)
class ReactOkHttpNetworkFetcherTest {
  private lateinit var httpClient: OkHttpClient
  private lateinit var fetcher: ReactOkHttpNetworkFetcher
  private lateinit var fetchState: OkHttpNetworkFetcher.OkHttpNetworkFetchState
  private lateinit var callback: NetworkFetcher.Callback
  private lateinit var imageRequest: ReactNetworkImageRequest

  @Captor private lateinit var requestArgumentCaptor: ArgumentCaptor<Request>

  @Before
  fun prepareModules() {
    val executorService = mock(ExecutorService::class.java)
    val dispatcher = Dispatcher(executorService)
    httpClient = spy(OkHttpClient.Builder().dispatcher(dispatcher).build())
    fetcher = ReactOkHttpNetworkFetcher(httpClient)

    fetchState = mock(OkHttpNetworkFetcher.OkHttpNetworkFetchState::class.java)
    callback = mock(NetworkFetcher.Callback::class.java)

    val mockUri = Uri.parse("https://www.facebook.com")
    whenever(fetchState.uri).thenReturn(mockUri)

    val producerContext = mock(ProducerContext::class.java)
    imageRequest = mock(ReactNetworkImageRequest::class.java)
    whenever(imageRequest.headers).thenReturn(null)
    whenever(producerContext.imageRequest).thenReturn(imageRequest)
    whenever(fetchState.context).thenReturn(producerContext)

    requestArgumentCaptor = ArgumentCaptor.forClass(Request::class.java)
  }

  @Test
  fun testCacheControlDefault() {
    whenever(imageRequest.cacheControl).thenReturn(ImageCacheControl.DEFAULT)

    fetcher.fetch(fetchState, callback)

    verify(httpClient, times(1)).newCall(anyOrNull(Request::class.java))
    verify(httpClient).newCall(capture(requestArgumentCaptor))

    val capturedRequest = requestArgumentCaptor.value

    assertThat(capturedRequest.cacheControl().noStore()).isEqualTo(true)
    assertThat(capturedRequest.headers()["Cache-Control"]).isEqualTo("no-store")
    assertThat(capturedRequest.headers().size()).isEqualTo(1)
  }

  @Test
  fun testCacheControlReload() {
    whenever(imageRequest.cacheControl).thenReturn(ImageCacheControl.RELOAD)

    fetcher.fetch(fetchState, callback)

    verify(httpClient, times(1)).newCall(anyOrNull(Request::class.java))
    verify(httpClient).newCall(capture(requestArgumentCaptor))

    val capturedRequest = requestArgumentCaptor.value

    assertThat(capturedRequest.cacheControl().noCache()).isEqualTo(true)
    assertThat(capturedRequest.cacheControl().noStore()).isEqualTo(true)
    assertThat(capturedRequest.headers()["Cache-Control"]).isEqualTo("no-cache, no-store")
    assertThat(capturedRequest.headers().size()).isEqualTo(1)
  }

  @Test
  fun testCacheControlForceCache() {
    whenever(imageRequest.cacheControl).thenReturn(ImageCacheControl.FORCE_CACHE)

    fetcher.fetch(fetchState, callback)

    verify(httpClient, times(1)).newCall(anyOrNull(Request::class.java))
    verify(httpClient).newCall(capture(requestArgumentCaptor))

    val capturedRequest = requestArgumentCaptor.value

    assertThat(capturedRequest.cacheControl().maxStaleSeconds()).isEqualTo(Integer.MAX_VALUE)
    assertThat(capturedRequest.headers()["Cache-Control"])
        .isEqualTo("max-stale=${Integer.MAX_VALUE}")
    assertThat(capturedRequest.headers().size()).isEqualTo(1)
  }

  @Test
  fun testCacheControlOnlyIfCached() {
    whenever(imageRequest.cacheControl).thenReturn(ImageCacheControl.ONLY_IF_CACHED)

    fetcher.fetch(fetchState, callback)

    verify(httpClient, times(1)).newCall(anyOrNull(Request::class.java))
    verify(httpClient).newCall(capture(requestArgumentCaptor))

    val capturedRequest = requestArgumentCaptor.value

    assertThat(capturedRequest.cacheControl().onlyIfCached()).isEqualTo(true)
    assertThat(capturedRequest.cacheControl().maxStaleSeconds()).isEqualTo(Integer.MAX_VALUE)
    assertThat(capturedRequest.headers()["Cache-Control"])
        .isEqualTo("max-stale=${Integer.MAX_VALUE}, only-if-cached")
    assertThat(capturedRequest.headers().size()).isEqualTo(1)
  }
}
