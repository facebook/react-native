/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import java.io.FilterOutputStream
import java.io.IOException
import okhttp3.MediaType
import okhttp3.RequestBody
import okio.BufferedSink
import okio.Okio
import okio.Okio.sink
import okio.Sink

internal class ProgressRequestBody(
    private val requestBody: RequestBody,
    private val progressListener: ProgressListener
) : RequestBody() {

  private var _contentLength = 0L

  override fun contentType(): MediaType? = requestBody.contentType()

  @Throws(IOException::class)
  override fun contentLength(): Long {
    if (_contentLength == 0L) {
      _contentLength = requestBody.contentLength()
    }
    return _contentLength
  }

  @Throws(IOException::class)
  override fun writeTo(sink: BufferedSink) {
    // In 99% of cases, this method is called strictly once.
    // The only case when it is called more than once is internal okhttp upload re-try.
    // We need to re-create CountingOutputStream in this case as progress should be re-evaluated.
    val sinkWrapper = Okio.buffer(outputStreamSink(sink))

    // contentLength changes for input streams, since we're using inputStream.available(),
    // so get the length before writing to the sink
    contentLength()
    requestBody.writeTo(sinkWrapper)
    sinkWrapper.flush()
  }

  private fun outputStreamSink(sink: BufferedSink): Sink =
      Okio.sink(
          object : FilterOutputStream(sink.outputStream()) {
            private var count = 0L

            @Throws(IOException::class)
            override fun write(b: ByteArray, off: Int, len: Int) {
              super.write(b, off, len)
              count += len.toLong()
              sendProgressUpdate()
            }

            @Throws(IOException::class)
            override fun write(b: Int) {
              super.write(b)
              count++
              sendProgressUpdate()
            }

            @Throws(IOException::class)
            private fun sendProgressUpdate() {
              val bytesWritten = count
              val contentLength = contentLength()
              progressListener.onProgress(
                  bytesWritten, contentLength, bytesWritten == contentLength)
            }
          })
}
