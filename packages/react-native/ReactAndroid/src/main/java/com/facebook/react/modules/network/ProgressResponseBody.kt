/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import java.io.IOException
import okhttp3.MediaType
import okhttp3.ResponseBody
import okio.Buffer
import okio.BufferedSource
import okio.ForwardingSource
import okio.Okio
import okio.Source

public class ProgressResponseBody(
    private val responseBody: ResponseBody,
    private val progressListener: ProgressListener
) : ResponseBody() {

  private val _bufferedSource: BufferedSource by
      lazy(LazyThreadSafetyMode.NONE) { Okio.buffer(source(responseBody.source())) }
  private var _totalBytesRead = 0L

  override fun contentType(): MediaType? = responseBody.contentType()

  override fun contentLength(): Long = responseBody.contentLength()

  public fun totalBytesRead(): Long = _totalBytesRead

  override fun source(): BufferedSource = _bufferedSource

  private fun source(source: Source): Source {
    return object : ForwardingSource(source) {
      @Throws(IOException::class)
      override fun read(sink: Buffer, byteCount: Long): Long {
        val bytesRead = super.read(sink, byteCount)
        // read() returns the number of bytes read, or -1 if this source is exhausted.
        if (bytesRead != -1L) {
          _totalBytesRead += bytesRead
        }
        progressListener.onProgress(_totalBytesRead, responseBody.contentLength(), bytesRead == -1L)
        return bytesRead
      }
    }
  }
}
