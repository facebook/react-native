/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Conflicting okhttp versions
@file:Suppress("DEPRECATION_ERROR")

package com.facebook.react.modules.network

import android.content.ContentResolver
import android.content.Context
import android.net.Uri
import java.io.ByteArrayInputStream
import java.util.zip.GZIPInputStream
import okhttp3.MediaType
import okio.Buffer
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class RequestBodyUtilTest {

  @Test
  fun testIsGzipEncoding() {
    assertThat(RequestBodyUtil.isGzipEncoding("gzip")).isTrue()
    assertThat(RequestBodyUtil.isGzipEncoding("GzIp")).isTrue()
    assertThat(RequestBodyUtil.isGzipEncoding("identity")).isFalse()
    assertThat(RequestBodyUtil.isGzipEncoding(null)).isFalse()
  }

  @Test
  fun testGetFileInputStreamWithHttpUri() {
    val context = mock<Context>()
    val fileUri = "http://example.com/file"

    // Since getDownloadFileInputStream is private and not mocked, it will throw an exception.
    val result = RequestBodyUtil.getFileInputStream(context, fileUri)

    assertThat(result).isNull() // Expected null due to exception handling
  }

  @Test
  fun testGetFileInputStreamWithDataUri() {
    val context = mock<Context>()
    val fileUri = "data:text/plain;base64,SGVsbG8gV29ybGQ="

    val result = RequestBodyUtil.getFileInputStream(context, fileUri)

    assertThat("Hello World").isEqualTo(result?.bufferedReader()?.use { it.readText() })
  }

  @Test
  fun testGetFileInputStreamWithContentUri() {
    val context = mock<Context>()
    val contentResolver = mock<ContentResolver>()
    whenever(context.contentResolver).thenReturn(contentResolver)

    val fileUri = "content://com.example.provider/file"
    val testInputStream = ByteArrayInputStream("Sample Content".toByteArray())

    whenever(contentResolver.openInputStream(Uri.parse(fileUri))).thenReturn(testInputStream)

    val result = RequestBodyUtil.getFileInputStream(context, fileUri)

    assertThat("Sample Content").isEqualTo(result?.bufferedReader()?.use { it.readText() })
  }

  @Test
  fun testGetFileInputStreamWithInvalidUri() {
    val context = mock<Context>()
    val invalidUri = "invalid-uri"

    val result = RequestBodyUtil.getFileInputStream(context, invalidUri)

    assertThat(result).isNull() // Expected null due to exception handling
  }

  @Test
  fun testCreateGzipWithValidInput() {
    val mediaType = checkNotNull(MediaType.parse("text/plain"))
    val input = "Hello Gzip"

    val requestBody = RequestBodyUtil.createGzip(mediaType, input)

    checkNotNull(requestBody)

    val buffer = Buffer()
    requestBody.writeTo(buffer)

    val gzipInputStream = GZIPInputStream(ByteArrayInputStream(buffer.readByteArray()))
    val result = gzipInputStream.bufferedReader().use { it.readText() }

    assertThat(input).isEqualTo(result)
  }

  @Test
  fun testCreateGzipWithEmptyInput() {
    val mediaType = checkNotNull(MediaType.parse("text/plain"))
    val input = ""

    val requestBody = RequestBodyUtil.createGzip(mediaType, input)

    checkNotNull(requestBody)

    val buffer = Buffer()
    requestBody.writeTo(buffer)

    val gzipInputStream = GZIPInputStream(ByteArrayInputStream(buffer.readByteArray()))
    val result = gzipInputStream.bufferedReader().use { it.readText() }

    assertThat(input).isEqualTo(result)
  }

  @Test
  fun testCreateGzipWithNullInput() {
    val mediaType = checkNotNull(MediaType.parse("text/plain"))

    val requestBody = RequestBodyUtil.createGzip(mediaType, "")

    checkNotNull(requestBody)

    val buffer = Buffer()
    requestBody.writeTo(buffer)

    val gzipInputStream = GZIPInputStream(ByteArrayInputStream(buffer.readByteArray()))
    val result = gzipInputStream.bufferedReader().use { it.readText() }

    assertThat(result).isEmpty()
  }

  @Test
  fun testCreateWithInputStream() {
    val mediaType = checkNotNull(MediaType.parse("text/plain"))
    val inputStream = ByteArrayInputStream("Test InputStream".toByteArray())

    val requestBody = RequestBodyUtil.create(mediaType, inputStream)

    checkNotNull(requestBody)

    val buffer = Buffer()
    requestBody.writeTo(buffer)

    assertThat("Test InputStream").isEqualTo(buffer.readUtf8())
  }
}
