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
import org.mockito.kotlin.KArgumentCaptor
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.mock
import org.mockito.kotlin.spy
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReactOkHttpNetworkFetcherTest {
  private lateinit var httpClient: OkHttpClient
  private lateinit var fetcher: ReactOkHttpNetworkFetcher
  private lateinit var fetchState: OkHttpNetworkFetcher.OkHttpNetworkFetchState
  private lateinit var callback: NetworkFetcher.Callback
  private lateinit var imageRequest: ReactNetworkImageRequest

  private lateinit var requestArgumentCaptor: KArgumentCaptor<Request>

  @Before
  fun prepareModules() {
    val executorService = mock<ExecutorService>()
    val dispatcher = Dispatcher(executorService)
    httpClient = spy(OkHttpClient.Builder().dispatcher(dispatcher).build())
    fetcher = ReactOkHttpNetworkFetcher(httpClient)

    fetchState = mock()
    callback = mock()

    val mockUri = Uri.parse("https://www.facebook.com")
    whenever(fetchState.uri).thenReturn(mockUri)

    val producerContext = mock<ProducerContext>()
    imageRequest = mock()
    whenever(imageRequest.headers).thenReturn(null)
    whenever(producerContext.imageRequest).thenReturn(imageRequest)
    whenever(fetchState.context).thenReturn(producerContext)

    requestArgumentCaptor = argumentCaptor()
  }

  @Test
  fun testCacheControlDefault() {
    whenever(imageRequest.cacheControl).thenReturn(ImageCacheControl.DEFAULT)

    fetcher.fetch(fetchState, callback)

    with(requestArgumentCaptor) {
      verify(httpClient, times(1)).newCall(any())
      verify(httpClient).newCall(capture())
      val capturedRequest = firstValue
      assertThat(capturedRequest.cacheControl().noStore()).isEqualTo(true)
      assertThat(capturedRequest.headers()["Cache-Control"]).isEqualTo("no-store")
      assertThat(capturedRequest.headers().size()).isEqualTo(1)
    }
  }

  @Test
  fun testCacheControlReload() {
    whenever(imageRequest.cacheControl).thenReturn(ImageCacheControl.RELOAD)

    fetcher.fetch(fetchState, callback)

    with(requestArgumentCaptor) {
      verify(httpClient, times(1)).newCall(any())
      verify(httpClient).newCall(capture())

      val capturedRequest = firstValue

      assertThat(capturedRequest.cacheControl().noCache()).isEqualTo(true)
      assertThat(capturedRequest.cacheControl().noStore()).isEqualTo(true)
      assertThat(capturedRequest.headers()["Cache-Control"]).isEqualTo("no-cache, no-store")
      assertThat(capturedRequest.headers().size()).isEqualTo(1)
    }
  }

  @Test
  fun testCacheControlForceCache() {
    whenever(imageRequest.cacheControl).thenReturn(ImageCacheControl.FORCE_CACHE)

    fetcher.fetch(fetchState, callback)

    with(requestArgumentCaptor) {
      verify(httpClient, times(1)).newCall(any())
      verify(httpClient).newCall(capture())
      val capturedRequest = firstValue

      assertThat(capturedRequest.cacheControl().maxStaleSeconds()).isEqualTo(Integer.MAX_VALUE)
      assertThat(capturedRequest.headers()["Cache-Control"])
          .isEqualTo("max-stale=${Integer.MAX_VALUE}")
      assertThat(capturedRequest.headers().size()).isEqualTo(1)
    }
  }

  @Test
  fun testCacheControlOnlyIfCached() {
    whenever(imageRequest.cacheControl).thenReturn(ImageCacheControl.ONLY_IF_CACHED)

    fetcher.fetch(fetchState, callback)

    with(requestArgumentCaptor) {
      verify(httpClient, times(1)).newCall(any())
      verify(httpClient).newCall(capture())

      val capturedRequest = firstValue

      assertThat(capturedRequest.cacheControl().onlyIfCached()).isEqualTo(true)
      assertThat(capturedRequest.cacheControl().maxStaleSeconds()).isEqualTo(Integer.MAX_VALUE)
      assertThat(capturedRequest.headers()["Cache-Control"])
          .isEqualTo("max-stale=${Integer.MAX_VALUE}, only-if-cached")
      assertThat(capturedRequest.headers().size()).isEqualTo(1)
    }
  }
}
