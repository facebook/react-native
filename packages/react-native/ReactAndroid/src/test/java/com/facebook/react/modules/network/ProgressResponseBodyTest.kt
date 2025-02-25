/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Conflicting okhttp versions
@file:Suppress("DEPRECATION_ERROR")

package com.facebook.react.modules.network

import java.io.ByteArrayInputStream
import okhttp3.MediaType
import okhttp3.ResponseBody
import okio.Buffer
import okio.BufferedSource
import okio.Okio
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify

class ProgressResponseBodyTest {
  private lateinit var progressListener: ProgressListener

  @Before
  fun setUp() {
    progressListener = ProgressListener { _, _, _ -> }
  }

  private fun createResponseBody(
      contentType: MediaType? = MediaType.parse("application/octet-stream"),
      contentLength: Long = 0L,
      content: ByteArray = ByteArray(0)
  ): ResponseBody {
    val inputStream = ByteArrayInputStream(content)
    val bufferedSource = Okio.buffer(Okio.source(inputStream))

    return object : ResponseBody() {
      override fun contentType(): MediaType? = contentType

      override fun contentLength(): Long = contentLength

      override fun source(): BufferedSource = bufferedSource
    }
  }

  @Test
  fun testContentType() {
    val testMediaType = MediaType.parse("application/json")
    val responseBody = createResponseBody(contentType = testMediaType)
    val progressResponseBody = ProgressResponseBody(responseBody, progressListener)

    assertThat(progressResponseBody.contentType()).isEqualTo(testMediaType)
  }

  @Test
  fun testContentLengthKnown() {
    val contentLength = 1234L
    val responseBody = createResponseBody(contentLength = contentLength)
    val progressResponseBody = ProgressResponseBody(responseBody, progressListener)

    assertThat(progressResponseBody.contentLength()).isEqualTo(contentLength)
  }

  @Test
  fun testContentLengthUnknown() {
    val contentLength = -1L
    val responseBody = createResponseBody(contentLength = contentLength)
    val progressResponseBody = ProgressResponseBody(responseBody, progressListener)

    assertThat(progressResponseBody.contentLength()).isEqualTo(contentLength)
  }

  @Test
  fun testContentLengthZero() {
    val contentLength = 0L
    val responseBody = createResponseBody(contentLength = contentLength)
    val progressResponseBody = ProgressResponseBody(responseBody, progressListener)

    assertThat(progressResponseBody.contentLength()).isEqualTo(contentLength)
  }

  // OkHttp 3.x compatibility, replace with `toResponseBody` when migrating to OkHttp 4.x.
  /** Test that totalBytesRead() accurately reflects the number of bytes read from the source. */
  @Suppress("DEPRECATION")
  @Test
  fun testTotalBytesRead() {
    val contentBytes = ByteArray(100000) { 'a'.code.toByte() }
    val contentType = MediaType.parse("text/plain")
    val responseBody = ResponseBody.create(contentType, contentBytes)
    val progressResponseBody = ProgressResponseBody(responseBody, progressListener)

    val source = progressResponseBody.source()
    val buffer = Buffer()
    val MIN_BYTES_READ: Long = 8192

    val bytesRead1 = source.read(buffer, MIN_BYTES_READ)
    assertThat(bytesRead1).isEqualTo(MIN_BYTES_READ)
    assertThat(progressResponseBody.totalBytesRead()).isEqualTo(MIN_BYTES_READ)

    val bytesRead2 = source.read(buffer, MIN_BYTES_READ)
    assertThat(bytesRead2).isEqualTo(MIN_BYTES_READ)
    assertThat(progressResponseBody.totalBytesRead()).isEqualTo(MIN_BYTES_READ * 2)

    val bytesRead3 = source.read(buffer, MIN_BYTES_READ)
    assertThat(bytesRead3).isEqualTo(MIN_BYTES_READ)
    assertThat(progressResponseBody.totalBytesRead()).isEqualTo(MIN_BYTES_READ * 3)
  }

  /** Test that multiple calls to source() return the same BufferedSource instance. */
  @Test
  fun testSourceReturnsSameInstance() {
    val responseBody = createResponseBody()
    val progressResponseBody = ProgressResponseBody(responseBody, progressListener)

    val source1 = progressResponseBody.source()
    val source2 = progressResponseBody.source()

    assertThat(source1).isEqualTo(source2)
  }

  // OkHttp 3.x compatibility, replace with `toResponseBody` when migrating to OkHttp 4.x.
  @Suppress("DEPRECATION")
  @Test
  fun testReadEndOfStream() {
    val contentBytes = ByteArray(100) { 'a'.code.toByte() }
    val contentType = MediaType.parse("text/plain")
    val responseBody = ResponseBody.create(contentType, contentBytes)
    val progressResponseBody = ProgressResponseBody(responseBody, progressListener)

    val source = progressResponseBody.source()
    val buffer = Buffer()

    source.read(buffer, 100)
    val bytesRead = source.read(buffer, 10) // Try reading past the end of the stream

    assertThat(bytesRead).isEqualTo(-1) // Ensure -1 is returned at the end of the stream
    assertThat(progressResponseBody.totalBytesRead()).isEqualTo(contentBytes.size.toLong())
  }

  // OkHttp 3.x compatibility, replace with `toResponseBody` when migrating to OkHttp 4.x.
  @Suppress("DEPRECATION")
  @Test
  fun testProgressListenerCalls() {
    val contentBytes = ByteArray(100) { 'a'.code.toByte() }
    val contentType = MediaType.parse("text/plain")
    val responseBody = ResponseBody.create(contentType, contentBytes)
    val mockProgressListener = mock<ProgressListener>()
    val progressResponseBody = ProgressResponseBody(responseBody, mockProgressListener)

    val source = progressResponseBody.source()
    val buffer = Buffer()

    source.read(buffer, 100L)
    verify(mockProgressListener, times(1)).onProgress(eq(100L), eq(100L), eq(false))

    source.read(buffer, 10L) // Try reading past the end of the stream
    verify(mockProgressListener, times(1)).onProgress(eq(100L), eq(100L), eq(true))
  }
}
