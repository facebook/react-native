/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.modules.network

import java.io.IOException
import okhttp3.MediaType
import okhttp3.ResponseBody
import okio.Buffer
import okio.BufferedSource
import okio.ForwardingSource
import okio.Okio
import okio.Source

public class ProgressResponseBody
public constructor(
    private val responseBody: ResponseBody,
    private val progressListener: ProgressListener,
) : ResponseBody() {
  private lateinit var bufferedSource: BufferedSource
  private var totalBytesRead = 0L

  public override fun contentType(): MediaType? = responseBody.contentType()

  override fun contentLength(): Long = responseBody.contentLength()

  public fun totalBytesRead(): Long = totalBytesRead

  public override fun source(): BufferedSource {
    if (!::bufferedSource.isInitialized) {
      bufferedSource = Okio.buffer(source(responseBody.source()))
    }
    return bufferedSource
  }

  private fun source(source: Source): Source {
    return object : ForwardingSource(source) {
      @Throws(IOException::class)
      override fun read(sink: Buffer, byteCount: Long): Long {
        // read() returns the number of bytes read, or -1 if this source is exhausted.
        return super.read(sink, byteCount).also { bytesRead ->
          if (bytesRead != -1L) {
            totalBytesRead += bytesRead
          }
          progressListener.onProgress(
              totalBytesRead,
              responseBody.contentLength(),
              bytesRead == -1L,
          )
        }
      }
    }
  }
}
