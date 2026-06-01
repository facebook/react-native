/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okio versions

package com.facebook.react.devsupport

import java.io.IOException
import okio.Buffer
import okio.BufferedSink
import okio.BufferedSource
import okio.ByteString

/**
 * Streaming parser for `multipart/mixed` responses.
 *
 * Unlike a buffer-all-then-split parser, this implementation keeps a working buffer that is at
 * most `READ_CHUNK_SIZE + maxDelimLen` bytes large. Body bytes for a chunk are either:
 *
 *  * delivered to a [BufferedSink] returned by [ChunkListener.onChunkHeader] (preferred for
 *    large bodies — e.g. the JS bundle), in which case they never accumulate in the reader's
 *    heap; or
 *  * accumulated into a per-chunk [Buffer] and delivered via [ChunkListener.onChunkComplete]
 *    (preferred for small bodies like progress JSON, where the listener wants to parse them).
 *
 * The reader does not know whether a given chunk is the final one until it encounters the next
 * delimiter. Listeners that need to route based on "is this the last chunk?" must instead use
 * the chunk headers (e.g. Content-Type or X-Http-Status).
 */
internal class MultipartStreamReader(
    private val source: BufferedSource,
    boundary: String,
) {

  private val regularDelim: ByteString = ByteString.encodeUtf8("$CRLF--$boundary$CRLF")
  private val closeDelim: ByteString = ByteString.encodeUtf8("$CRLF--$boundary--$CRLF")
  private val headerSep: ByteString = ByteString.encodeUtf8("$CRLF$CRLF")
  private val maxDelimLen: Long = maxOf(regularDelim.size(), closeDelim.size()).toLong()

  private var lastProgressEvent: Long = 0

  interface ChunkListener {
    /**
     * Invoked when a new chunk's headers have been parsed but before its body is read.
     *
     * Return a [BufferedSink] to have the reader stream the chunk body directly into it. In
     * that case, the body bytes are never buffered in the reader and the `body` argument to
     * [onChunkComplete] will be `null`.
     *
     * Return `null` to have the reader accumulate the body in memory and pass it to
     * [onChunkComplete] as a [Buffer]. This is appropriate for small chunks that the listener
     * intends to parse in full (e.g. JSON progress events).
     *
     * The reader does not know whether this chunk is the last one until it encounters the
     * next delimiter — routing decisions must rely on the supplied [headers].
     */
    @Throws(IOException::class)
    fun onChunkHeader(headers: Map<String, String>): BufferedSink?

    /**
     * Invoked when the chunk body is fully consumed.
     *
     * @param body the accumulated body, non-null iff [onChunkHeader] returned `null`.
     */
    @Throws(IOException::class)
    fun onChunkComplete(headers: Map<String, String>, body: Buffer?, isLastChunk: Boolean)

    /** Invoked at most once every ~16 ms while the current chunk's body is being read. */
    @Throws(IOException::class)
    fun onChunkProgress(headers: Map<String, String>, loaded: Long, total: Long)
  }

  /**
   * Read all parts of the multipart response and invoke the listener for each chunk received.
   *
   * @return `true` if a valid closing delimiter was reached; `false` if the upstream ended
   *   prematurely.
   */
  @Throws(IOException::class)
  fun readAllParts(listener: ChunkListener): Boolean {
    val buffer = Buffer()

    // Skip the preamble — discard bytes until the first regular delimiter appears. We never
    // observe a close delimiter before the first regular one in a well-formed response.
    if (!skipUntil(buffer, regularDelim)) return false
    buffer.skip(regularDelim.size().toLong())

    while (true) {
      val headers = readHeaders(buffer) ?: return false

      val sink = listener.onChunkHeader(headers)
      val accumulator: Buffer? = if (sink == null) Buffer() else null
      val contentLength = headers["Content-Length"]?.toLongOrNull() ?: 0L

      var bodyDelivered = 0L
      var isLast = false
      var done = false

      while (!done) {
        val hit = findDelimiter(buffer)
        if (hit != null) {
          // Body ends at hit.index; transfer those bytes, then consume the delimiter.
          if (hit.index > 0) {
            transfer(buffer, hit.index, sink, accumulator)
            bodyDelivered += hit.index
          }
          buffer.skip(hit.delimSize)
          isLast = hit.isClose
          done = true
        } else {
          // No delimiter yet — drain bytes that cannot possibly start an upcoming match (keep
          // the last `maxDelimLen - 1` bytes as lookahead) and read more from upstream.
          val safeToDrain = buffer.size() - (maxDelimLen - 1)
          if (safeToDrain > 0) {
            transfer(buffer, safeToDrain, sink, accumulator)
            bodyDelivered += safeToDrain
            emitProgress(headers, bodyDelivered, contentLength, isFinal = false, listener)
          }
          val read = source.read(buffer, READ_CHUNK_SIZE)
          if (read <= 0L) return false
        }
      }

      emitProgress(headers, bodyDelivered, contentLength, isFinal = true, listener)
      sink?.flush()
      listener.onChunkComplete(headers, accumulator, isLast)

      if (isLast) return true
    }
  }

  /** Read from upstream until [delim] appears in [buffer]; do not consume the delimiter. */
  @Throws(IOException::class)
  private fun skipUntil(buffer: Buffer, delim: ByteString): Boolean {
    val keep = (delim.size() - 1).toLong()
    while (true) {
      val idx = buffer.indexOf(delim)
      if (idx >= 0) {
        buffer.skip(idx)
        return true
      }
      val drop = buffer.size() - keep
      if (drop > 0) buffer.skip(drop)
      val read = source.read(buffer, READ_CHUNK_SIZE)
      if (read <= 0L) return false
    }
  }

  /**
   * Read and parse the chunk header block, consuming the trailing CRLF CRLF separator. If a
   * delimiter is encountered before the header separator, the chunk is treated as having no
   * headers and an empty map is returned without consuming the delimiter.
   */
  @Throws(IOException::class)
  private fun readHeaders(buffer: Buffer): Map<String, String>? {
    while (true) {
      val sepIdx = buffer.indexOf(headerSep)
      val regIdx = buffer.indexOf(regularDelim)
      val closeIdx = buffer.indexOf(closeDelim)
      val nextDelim = minNonNegative(regIdx, closeIdx)

      if (sepIdx >= 0 && (nextDelim < 0 || sepIdx < nextDelim)) {
        val headersBuf = Buffer()
        buffer.read(headersBuf, sepIdx)
        buffer.skip(headerSep.size().toLong())
        return parseHeaders(headersBuf)
      }
      if (nextDelim >= 0) {
        // Chunk has no headers section; let the body loop consume the delimiter.
        return emptyMap()
      }
      val read = source.read(buffer, READ_CHUNK_SIZE)
      if (read <= 0L) return null
    }
  }

  /** Locate whichever of the regular or close delimiters appears first in [buffer]. */
  private fun findDelimiter(buffer: Buffer): DelimiterHit? {
    val regIdx = buffer.indexOf(regularDelim)
    val closeIdx = buffer.indexOf(closeDelim)
    return when {
      regIdx < 0 && closeIdx < 0 -> null
      regIdx < 0 -> DelimiterHit(closeIdx, closeDelim.size().toLong(), isClose = true)
      closeIdx < 0 -> DelimiterHit(regIdx, regularDelim.size().toLong(), isClose = false)
      regIdx <= closeIdx -> DelimiterHit(regIdx, regularDelim.size().toLong(), isClose = false)
      else -> DelimiterHit(closeIdx, closeDelim.size().toLong(), isClose = true)
    }
  }

  private data class DelimiterHit(val index: Long, val delimSize: Long, val isClose: Boolean)

  /**
   * Transfer [byteCount] bytes from [src] to either [sink] (streaming case) or [accumulator]
   * (buffered case). Both branches use okio segment-move semantics, so no per-byte copy
   * happens for large transfers.
   */
  @Throws(IOException::class)
  private fun transfer(src: Buffer, byteCount: Long, sink: BufferedSink?, accumulator: Buffer?) {
    if (byteCount <= 0L) return
    when {
      sink != null -> sink.write(src, byteCount)
      accumulator != null -> accumulator.write(src, byteCount)
      else -> src.skip(byteCount)
    }
  }

  private fun parseHeaders(data: Buffer): Map<String, String> {
    val headers: MutableMap<String, String> = mutableMapOf()
    val text = data.readUtf8()
    val lines = text.split(CRLF).dropLastWhile { it.isEmpty() }
    for (line in lines) {
      val sep = line.indexOf(':')
      if (sep == -1) continue
      val key = line.substring(0, sep).trim { it <= ' ' }
      val value = line.substring(sep + 1).trim { it <= ' ' }
      headers[key] = value
    }
    return headers
  }

  @Throws(IOException::class)
  private fun emitProgress(
      headers: Map<String, String>,
      loaded: Long,
      contentLength: Long,
      isFinal: Boolean,
      listener: ChunkListener,
  ) {
    val now = System.currentTimeMillis()
    if (isFinal || now - lastProgressEvent > 16) {
      lastProgressEvent = now
      listener.onChunkProgress(headers, loaded, contentLength)
    }
  }

  private fun minNonNegative(a: Long, b: Long): Long =
      when {
        a < 0 -> b
        b < 0 -> a
        else -> minOf(a, b)
      }

  companion object {
    private const val CRLF = "\r\n"
    private const val READ_CHUNK_SIZE: Long = 16L * 1024L
  }
}
