package com.facebook.react.devsupport

import java.io.IOException
import okio.Buffer
import okio.ByteString
import okio.ByteString.Companion.encodeUtf8
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MultipartStreamReaderTest {

  internal open class CallCountTrackingChunkCallback : MultipartStreamReader.ChunkListener {
    var callCount = 0
      private set

    @Throws(IOException::class)
    override fun onChunkComplete(headers: Map<String, String>?, body: Buffer, done: Boolean) {
      callCount++
    }

    @Throws(IOException::class)
    override fun onChunkProgress(headers: Map<String, String>, loaded: Long, total: Long) {}
  }

  @Test
  @Throws(IOException::class)
  fun testSimpleCase() {
    val response: ByteString =
      ("preable, should be ignored\r\n" +
        "--sample_boundary\r\n" +
        "Content-Type: application/json; charset=utf-8\r\n" +
        "Content-Length: 2\r\n\r\n" +
        "{}\r\n" +
        "--sample_boundary--\r\n" +
        "epilogue, should be ignored")
        .encodeUtf8()

    val source = Buffer()
    source.write(response)

    val reader = MultipartStreamReader(source, "sample_boundary")

    val callback: CallCountTrackingChunkCallback =
      object : CallCountTrackingChunkCallback() {
        @Throws(IOException::class)
        override fun onChunkComplete(
          headers: Map<String, String>?,
          body: Buffer,
          done: Boolean
        ) {
          super.onChunkComplete(headers, body, done)

          assertThat(done).isTrue
          assertThat(headers!!["Content-Type"])
            .isEqualTo("application/json; charset=utf-8")
          assertThat(body.readUtf8()).isEqualTo("{}")
        }
      }
    val success = reader.readAllParts(callback)

    assertThat(callback.callCount).isEqualTo(1)
    assertThat(success).isTrue
  }

  @Test
  @Throws(IOException::class)
  fun testMultipleParts() {
    val response: ByteString =
      ("preable, should be ignored\r\n" +
        "--sample_boundary\r\n" +
        "1\r\n" +
        "--sample_boundary\r\n" +
        "2\r\n" +
        "--sample_boundary\r\n" +
        "3\r\n" +
        "--sample_boundary--\r\n" +
        "epilogue, should be ignored")
        .encodeUtf8()

    val source = Buffer()
    source.write(response)

    val reader = MultipartStreamReader(source, "sample_boundary")

    val callback: CallCountTrackingChunkCallback =
      object : CallCountTrackingChunkCallback() {
        @Throws(IOException::class)
        override fun onChunkComplete(
          headers: Map<String, String>?,
          body: Buffer,
          done: Boolean
        ) {
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
  @Throws(IOException::class)
  fun testNoDelimiter() {
    val response: ByteString = "Yolo".encodeUtf8()

    val source = Buffer()
    source.write(response)

    val reader = MultipartStreamReader(source, "sample_boundary")

    val callback = CallCountTrackingChunkCallback()
    val success = reader.readAllParts(callback)

    assertThat(callback.callCount).isEqualTo(0)
    assertThat(success).isFalse
  }

  @Test
  @Throws(IOException::class)
  fun testNoCloseDelimiter() {
    val response: ByteString =
      ("preamble, should be ignored\r\n" +
        "--sample_boundary\r\n" +
        "Content-Type: application/json; charset=utf-8\r\n" +
        "Content-Length: 2\r\n\r\n" +
        "{}\r\n" +
        "--sample_boundary\r\n" +
        "incomplete message...")
        .encodeUtf8()

    val source = Buffer()
    source.write(response)

    val reader = MultipartStreamReader(source, "sample_boundary")

    val callback = CallCountTrackingChunkCallback()
    val success = reader.readAllParts(callback)

    assertThat(callback.callCount).isEqualTo(1)
    assertThat(success).isFalse
  }
}
