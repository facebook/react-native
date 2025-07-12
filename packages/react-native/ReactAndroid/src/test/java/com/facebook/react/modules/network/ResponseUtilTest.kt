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
import com.facebook.testutils.shadows.ShadowArguments
import java.net.SocketTimeoutException
import org.assertj.core.api.Assertions.assertThat
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
class ResponseUtilTest {
  private lateinit var reactContext: ReactApplicationContext

  @Before
  fun setUp() {
    reactContext = mock()
  }

  @Test
  fun testOnDataSend() {
    val requestId = 1
    val progress = 100L
    val total = 1000L

    ResponseUtil.onDataSend(reactContext, requestId, progress, total)

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

    ResponseUtil.onIncrementalDataReceived(reactContext, requestId, data, progress, total)

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

    ResponseUtil.onDataReceivedProgress(reactContext, requestId, progress, total)

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

    ResponseUtil.onDataReceived(reactContext, requestId, data)

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

    ResponseUtil.onDataReceived(reactContext, requestId, data)

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

    ResponseUtil.onRequestError(reactContext, requestId, error, e)

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

    ResponseUtil.onRequestError(reactContext, requestId, error, e)

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

    ResponseUtil.onRequestSuccess(reactContext, requestId)

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
    val headers: WritableMap =
        Arguments.createMap().apply { putString("Content-Type", "application/json") }
    val url = "http://example.com"

    ResponseUtil.onResponseReceived(reactContext, requestId, statusCode, headers, url)

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableArray::class.java)

    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("didReceiveNetworkResponse")

    val args = eventArgumentsCaptor.value
    assertThat(args.size()).isEqualTo(4)
    assertThat(args.getInt(0)).isEqualTo(requestId)
    assertThat(args.getInt(1)).isEqualTo(statusCode)
    assertThat(args.getMap(2)).isEqualTo(headers)
    assertThat(args.getString(3)).isEqualTo(url)
  }

  @Test
  fun testNullReactContext() {
    ResponseUtil.onDataSend(null, 1, 100, 1000)
    ResponseUtil.onIncrementalDataReceived(null, 1, "data", 100, 1000)
    ResponseUtil.onDataReceivedProgress(null, 1, 100, 1000)
    ResponseUtil.onDataReceived(null, 1, "data")
    ResponseUtil.onDataReceived(null, 1, Arguments.createMap())
    ResponseUtil.onRequestError(null, 1, "error", null)
    ResponseUtil.onRequestSuccess(null, 1)
    ResponseUtil.onResponseReceived(null, 1, 200, Arguments.createMap(), "http://example.com")

    verify(reactContext, never()).emitDeviceEvent(any<String>(), any())
  }
}
