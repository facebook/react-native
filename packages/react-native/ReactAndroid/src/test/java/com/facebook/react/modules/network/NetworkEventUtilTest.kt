/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.testutils.shadows.ShadowArguments
import java.net.SocketTimeoutException
import okhttp3.Headers
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentCaptor
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@Config(shadows = [ShadowArguments::class])
@RunWith(RobolectricTestRunner::class)
class NetworkEventUtilTest {
  private lateinit var reactContext: ReactApplicationContext

  @Before
  fun setUp() {
    reactContext = mock()

    ReactNativeFeatureFlagsForTests.setUp()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableNetworkEventReporting(): Boolean = false
        })
  }

  @After
  fun tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun testOnDataSend() {
    val requestId = 1
    val progress = 100L
    val total = 1000L

    NetworkEventUtil.onDataSend(reactContext, requestId, progress, total)

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didSendNetworkData")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(3)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getInt(1)).isEqualTo(progress.toInt())
    assertThat(args.getInt(2)).isEqualTo(total.toInt())
  }

  @Test
  fun testOnIncrementalDataReceived() {
    val requestId = 1
    val data = "some data"
    val progress = 100L
    val total = 1000L

    NetworkEventUtil.onIncrementalDataReceived(reactContext, requestId, data, progress, total)

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didReceiveNetworkIncrementalData")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(4)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getString(1)).isEqualTo(data)
    assertThat(args.getInt(2)).isEqualTo(progress.toInt())
    assertThat(args.getInt(3)).isEqualTo(total.toInt())
  }

  @Test
  fun testOnDataReceivedProgress() {
    val requestId = 1
    val progress = 500L
    val total = 1000L

    NetworkEventUtil.onDataReceivedProgress(reactContext, requestId, progress, total)

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didReceiveNetworkDataProgress")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(3)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getInt(1)).isEqualTo(progress.toInt())
    assertThat(args.getInt(2)).isEqualTo(total.toInt())
  }

  @Test
  fun testOnDataReceived() {
    val requestId = 1
    val data = "response data"

    NetworkEventUtil.onDataReceived(reactContext, requestId, data)

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didReceiveNetworkData")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(2)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getString(1)).isEqualTo(data)
  }

  @Test
  fun testOnDataReceivedMap() {
    val requestId = 1
    val data: WritableMap = Arguments.createMap().apply { putString("key", "value") }

    NetworkEventUtil.onDataReceived(reactContext, requestId, data)

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didReceiveNetworkData")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(2)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getMap(1)).isEqualTo(data)
  }

  @Test
  fun testOnRequestError() {
    val requestId = 1
    val error = "An error occurred"
    val e: Throwable? = null

    NetworkEventUtil.onRequestError(reactContext, requestId, error, e)

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didCompleteNetworkResponse")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(2)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getString(1)).isEqualTo(error)
  }

  @Test
  fun testOnRequestErrorWithException() {
    val requestId = 1
    val error = "Timeout error"
    val e: Throwable = SocketTimeoutException()

    NetworkEventUtil.onRequestError(reactContext, requestId, error, e)

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didCompleteNetworkResponse")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(3)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getString(1)).isEqualTo(error)
    assertThat(args.getBoolean(2)).isTrue
  }

  @Test
  fun testOnRequestSuccess() {
    val requestId = 1

    NetworkEventUtil.onRequestSuccess(reactContext, requestId, 128)

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didCompleteNetworkResponse")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(2)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.isNull(1)).isTrue()
  }

  @Test
  fun testOnResponseReceived() {
    val requestId = 1
    val statusCode = 200
    val headers = Headers.Builder().add("Content-Type", "application/json").build()
    val url = "http://example.com"

    val request = Request.Builder().url(url).build()
    val response =
        Response.Builder()
            .protocol(Protocol.HTTP_1_1)
            .request(request)
            .headers(headers)
            .code(statusCode)
            .message("OK")
            .build()
    NetworkEventUtil.onResponseReceived(reactContext, requestId, url, response)

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didReceiveNetworkResponse")

    val expectedHeadersMap: WritableMap =
        Arguments.createMap().apply { putString("Content-Type", "application/json") }

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(4)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getInt(1)).isEqualTo(statusCode)
    assertThat(args.getMap(2)).isEqualTo(expectedHeadersMap)
    assertThat(args.getString(3)).isEqualTo(url)
  }

  @Test
  fun testNullReactContext() {
    val url = "http://example.com"
    val request = Request.Builder().url(url).build()
    val response =
        Response.Builder()
            .protocol(Protocol.HTTP_1_1)
            .request(request)
            .headers(Headers.Builder().build())
            .code(200)
            .message("OK")
            .build()

    NetworkEventUtil.onDataSend(null, 1, 100, 1000)
    NetworkEventUtil.onIncrementalDataReceived(null, 1, "data", 100, 1000)
    NetworkEventUtil.onDataReceivedProgress(null, 1, 100, 1000)
    NetworkEventUtil.onDataReceived(null, 1, "data")
    NetworkEventUtil.onDataReceived(null, 1, Arguments.createMap())
    NetworkEventUtil.onRequestError(null, 1, "error", null)
    NetworkEventUtil.onRequestSuccess(null, 1, 0)
    NetworkEventUtil.onResponseReceived(null, 1, url, response)

    verify(reactContext, never()).emitDeviceEvent(any<String>(), any())
  }
}
