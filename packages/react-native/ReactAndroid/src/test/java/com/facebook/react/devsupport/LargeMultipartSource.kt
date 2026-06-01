/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import okio.Buffer
import okio.Source
import okio.Timeout

/**
 * An [okio.Source] that synthesizes a syntactically valid `multipart/mixed` response containing a
 * single application/javascript payload of [payloadBytes] bytes.
 *
 * The bytes are produced lazily, so the test harness itself never holds the full payload in heap.
 * That makes it safe to use this in allocation- and peak-heap-sensitive tests at sizes (e.g.
 * 100 MB) that would otherwise dominate any measurement of the code under test.
 *
 * The emitted framing matches what [MultipartStreamReader] expects: a CRLF preamble followed by
 * `--<boundary>\r\n`, the headers block, the payload, and a final closing delimiter
 * `\r\n--<boundary>--\r\n`.
 */
internal class LargeMultipartSource(
    private val boundary: String,
    private val payloadBytes: Long,
    /** Maximum bytes returned per [read] call. Keeps the synthesizer's own memory tiny. */
    private val chunkSize: Int = 64 * 1024,
) : Source {

  private enum class Phase {
    PREAMBLE,
    HEADERS,
    PAYLOAD,
    CLOSE,
    DONE,
  }

  // Bytes that bracket the payload. Computed once, reused by reference.
  // NB: the reader's delimiter is "\r\n--<boundary>\r\n", so the preamble must end with CRLF.
  // A bare CRLF is the minimal valid preamble.
  private val preamble: ByteArray = "\r\n".toByteArray(Charsets.UTF_8)
  private val headers: ByteArray =
      ("--$boundary\r\n" +
              "Content-Type: application/javascript\r\n" +
              "Content-Length: $payloadBytes\r\n" +
              "\r\n")
          .toByteArray(Charsets.UTF_8)
  private val close: ByteArray = "\r\n--$boundary--\r\n".toByteArray(Charsets.UTF_8)

  // Single reused filler buffer. The exact byte value doesn't matter as long as it never spells
  // out the boundary string.
  private val filler: ByteArray = ByteArray(chunkSize) { 'A'.code.toByte() }

  private var phase: Phase = Phase.PREAMBLE
  private var payloadRemaining: Long = payloadBytes

  /** Total number of bytes this source will emit over its lifetime. Useful for assertions. */
  val totalBytes: Long
    get() = preamble.size + headers.size + payloadBytes + close.size

  override fun read(sink: Buffer, byteCount: Long): Long {
    require(byteCount >= 0) { "byteCount < 0: $byteCount" }
    if (byteCount == 0L) return 0
    return when (phase) {
      Phase.PREAMBLE -> {
        sink.write(preamble)
        phase = Phase.HEADERS
        preamble.size.toLong()
      }
      Phase.HEADERS -> {
        sink.write(headers)
        phase = if (payloadRemaining > 0) Phase.PAYLOAD else Phase.CLOSE
        headers.size.toLong()
      }
      Phase.PAYLOAD -> {
        val n = minOf(byteCount, payloadRemaining, filler.size.toLong()).toInt()
        sink.write(filler, 0, n)
        payloadRemaining -= n
        if (payloadRemaining == 0L) phase = Phase.CLOSE
        n.toLong()
      }
      Phase.CLOSE -> {
        sink.write(close)
        phase = Phase.DONE
        close.size.toLong()
      }
      Phase.DONE -> -1L
    }
  }

  override fun timeout(): Timeout = Timeout.NONE

  override fun close() = Unit
}
