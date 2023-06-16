/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import okio.Buffer
import okio.ByteString
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MultipartStreamReaderTest {

  @Test
  fun testSimpleCase() {
    val response: ByteString =
        encodeUtf8(
            "preamble, should be ignored\r\n" +
                "--sample_boundary\r\n" +
                "Content-Type: application/json; charset=utf-8\r\n" +
                "Content-Length: 2\r\n\r\n" +
                "{}\r\n" +
                "--sample_boundary--\r\n" +
                "epilogue, should be ignored")

    val source = Buffer()
    source.write(response)

    val reader = MultipartStreamReader(source, "sample_boundary")

    val callback: CallCountTrackingChunkCallback =
        object : CallCountTrackingChunkCallback() {
          override fun onChunkComplete(headers: Map<String, String>?, body: Buffer, done: Boolean) {
            super.onChunkComplete(headers, body, done)

            assertThat(done).isTrue
            assertThat(headers!!["Content-Type"]).isEqualTo("application/json; charset=utf-8")
            assertThat(body.readUtf8()).isEqualTo("{}")
          }
        }
    val success = reader.readAllParts(callback)

    assertThat(callback.callCount).isEqualTo(1)
    assertThat(success).isTrue
  }

  @Test
  fun testMultipleParts() {
    val response: ByteString =
        encodeUtf8(
            "preamble, should be ignored\r\n" +
                "--sample_boundary\r\n" +
                "1\r\n" +
                "--sample_boundary\r\n" +
                "2\r\n" +
                "--sample_boundary\r\n" +
                "3\r\n" +
                "--sample_boundary--\r\n" +
                "epilogue, should be ignored")

    val source = Buffer()
    source.write(response)

    val reader = MultipartStreamReader(source, "sample_boundary")

    val callback: CallCountTrackingChunkCallback =
        object : CallCountTrackingChunkCallback() {
          override fun onChunkComplete(headers: Map<String, String>?, body: Buffer, done: Boolean) {
            super.onChunkComplete(headers, body, done)

            assertThat(done).isEqualTo(callCount == 3)
            assertThat(body.readUtf8()).isEqualTo("$callCount")
          }
        }
    val success = reader.readAllParts(callback)

    assertThat(callback.callCount).isEqualTo(3)
    assertThat(success).isTrue
  }

  @Test
  fun testNoDelimiter() {
    val response: ByteString = encodeUtf8("Yolo")

    val source = Buffer()
    source.write(response)

    val reader = MultipartStreamReader(source, "sample_boundary")

    val callback = CallCountTrackingChunkCallback()
    val success = reader.readAllParts(callback)

    assertThat(callback.callCount).isEqualTo(0)
    assertThat(success).isFalse
  }

  @Test
  fun testNoCloseDelimiter() {
    val response: ByteString =
        encodeUtf8(
            "preamble, should be ignored\r\n" +
                "--sample_boundary\r\n" +
                "Content-Type: application/json; charset=utf-8\r\n" +
                "Content-Length: 2\r\n\r\n" +
                "{}\r\n" +
                "--sample_boundary\r\n" +
                "incomplete message...")

    val source = Buffer()
    source.write(response)

    val reader = MultipartStreamReader(source, "sample_boundary")

    val callback = CallCountTrackingChunkCallback()
    val success = reader.readAllParts(callback)

    assertThat(callback.callCount).isEqualTo(1)
    assertThat(success).isFalse
  }

  internal open class CallCountTrackingChunkCallback : MultipartStreamReader.ChunkListener {
    var callCount = 0
      private set

    override fun onChunkComplete(headers: Map<String, String>?, body: Buffer, done: Boolean) {
      callCount++
    }

    override fun onChunkProgress(headers: Map<String, String>, loaded: Long, total: Long) {}
  }

  private fun encodeUtf8(input: String): ByteString =
      ByteString.of(*input.toByteArray(Charsets.UTF_8))
}
