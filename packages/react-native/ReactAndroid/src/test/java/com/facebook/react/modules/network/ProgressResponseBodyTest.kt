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
import okio.buffer
import okio.source
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.mockito.ArgumentMatchers.eq
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify

@Suppress("DEPRECATION")
class ProgressResponseBodyTest {
  private lateinit var progressListener: ProgressListener
  private val mediaType: MediaType by lazy {
    MediaType.parse("application/octet-stream")!!
  }

  @Before
  fun setUp() {
    progressListener =
            object : ProgressListener {
              override fun onProgress(bytesWritten: Long, contentLength: Long, done: Boolean) {
                // No-op
              }
            }
  }

  private fun createResponseBody(
          contentType: MediaType? = mediaType,
          contentLength: Long = 0L,
          content: ByteArray = ByteArray(0)
  ): ResponseBody {
    val inputStream = ByteArrayInputStream(content)
    val bufferedSource = inputStream.source().buffer()

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

    assertEquals(testMediaType, progressResponseBody.contentType())
  }

  @Test
  fun testContentLengthKnown() {
    val contentLength = 1234L
    val responseBody = createResponseBody(contentLength = contentLength)
    val progressResponseBody = ProgressResponseBody(responseBody, progressListener)

    assertEquals(contentLength, progressResponseBody.contentLength())
  }

  @Test
  fun testContentLengthUnknown() {
    val contentLength = -1L
    val responseBody = createResponseBody(contentLength = contentLength)
    val progressResponseBody = ProgressResponseBody(responseBody, progressListener)

    assertEquals(contentLength, progressResponseBody.contentLength())
  }

  @Test
  fun testContentLengthZero() {
    val contentLength = 0L
    val responseBody = createResponseBody(contentLength = contentLength)
    val progressResponseBody = ProgressResponseBody(responseBody, progressListener)

    assertEquals(contentLength, progressResponseBody.contentLength())
  }

  /** Test that totalBytesRead() accurately reflects the number of bytes read from the source. */
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
    assertEquals(MIN_BYTES_READ, bytesRead1)
    assertEquals(MIN_BYTES_READ, progressResponseBody.totalBytesRead())

    val bytesRead2 = source.read(buffer, MIN_BYTES_READ)
    assertEquals(MIN_BYTES_READ, bytesRead2)
    assertEquals(MIN_BYTES_READ * 2, progressResponseBody.totalBytesRead())

    val bytesRead3 = source.read(buffer, MIN_BYTES_READ)
    assertEquals(MIN_BYTES_READ, bytesRead3)
    assertEquals(MIN_BYTES_READ * 3, progressResponseBody.totalBytesRead())
  }

  /** Test that multiple calls to source() return the same BufferedSource instance. */
  @Test
  fun testSourceReturnsSameInstance() {
    val responseBody = createResponseBody()
    val progressResponseBody = ProgressResponseBody(responseBody, progressListener)

    val source1 = progressResponseBody.source()
    val source2 = progressResponseBody.source()

    assertEquals(source1, source2)
  }

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

    assertEquals(-1L, bytesRead) // Ensure -1 is returned at the end of the stream
    assertEquals(contentBytes.size.toLong(), progressResponseBody.totalBytesRead())
  }

  @Test
  fun testProgressListenerCalls() {
    val contentBytes = ByteArray(100) { 'a'.code.toByte() }
    val contentType = MediaType.parse("text/plain")
    val responseBody = ResponseBody.create(contentType, contentBytes)
    val mockProgressListener = mock(ProgressListener::class.java)
    val progressResponseBody = ProgressResponseBody(responseBody, mockProgressListener)

    val source = progressResponseBody.source()
    val buffer = Buffer()

    source.read(buffer, 100L)
    verify(mockProgressListener, times(1)).onProgress(eq(100L), eq(100L), eq(false))

    source.read(buffer, 10L) // Try reading past the end of the stream
    verify(mockProgressListener, times(1)).onProgress(eq(100L), eq(100L), eq(true))
  }
}
