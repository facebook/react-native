/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okio versions

package com.facebook.react.devsupport

import okio.Buffer
import okio.BufferedSink
import okio.Okio
import okio.Sink
import okio.Timeout
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.experimental.categories.Category

/**
 * Performance & memory regression test for [MultipartStreamReader] against a 100 MB JavaScript
 * payload. Exercises the streaming path: the listener returns a [BufferedSink] from
 * [MultipartStreamReader.ChunkListener.onChunkHeader], so the body bytes should be transferred
 * to the sink without accumulating in heap.
 *
 * Run with:
 * ```
 * ./gradlew :packages:react-native:ReactAndroid:testDebugUnitTest \
 *     -PrunPerfTests -Preact.internal.useHermesNightly=true \
 *     --tests "*MultipartStreamReaderPerfTest"
 * ```
 */
@Category(PerformanceTest::class)
class MultipartStreamReaderPerfTest {

  private val boundary = "perf_boundary"
  private val payloadBytes = 100L * 1024 * 1024 // 100 MB

  @Before
  fun setUp() {
    AllocationProbe.requireSupported()
  }

  @Test
  fun streams100MBBundleWithBoundedAllocation() {
    val syntheticSource = LargeMultipartSource(boundary, payloadBytes)
    val bufferedSource = Okio.buffer(syntheticSource)
    val reader = MultipartStreamReader(bufferedSource, boundary)

    val discardingSink = CountingDiscardingSink()
    val bufferedSink = Okio.buffer(discardingSink)
    var receivedHeaders: Map<String, String> = emptyMap()
    var bufferDeliveredViaComplete = false

    val listener =
        object : MultipartStreamReader.ChunkListener {
          override fun onChunkHeader(headers: Map<String, String>): BufferedSink {
            receivedHeaders = headers
            return bufferedSink
          }

          override fun onChunkComplete(
              headers: Map<String, String>,
              body: Buffer?,
              isLastChunk: Boolean,
          ) {
            // body must be null when we returned a sink from onChunkHeader.
            if (body != null) bufferDeliveredViaComplete = true
          }

          override fun onChunkProgress(
              headers: Map<String, String>,
              loaded: Long,
              total: Long,
          ) = Unit
        }

    val threadId = Thread.currentThread().id
    AllocationProbe.settle()
    AllocationProbe.resetPeakHeap()
    val allocBefore = AllocationProbe.allocatedBytes(threadId)
    val nanosBefore = System.nanoTime()

    val success = reader.readAllParts(listener)
    bufferedSink.flush()

    val elapsedMs = (System.nanoTime() - nanosBefore) / 1_000_000
    val allocated = AllocationProbe.allocatedBytes(threadId) - allocBefore
    val peakHeap = AllocationProbe.peakHeapBytes()

    println(
        "[MultipartStreamReaderPerfTest] payload=${AllocationProbe.fmt(payloadBytes)} " +
            "elapsed=${elapsedMs}ms " +
            "thread-allocated=${AllocationProbe.fmt(allocated)} " +
            "peak-heap=${AllocationProbe.fmt(peakHeap)} " +
            "sink-bytes=${AllocationProbe.fmt(discardingSink.bytesWritten)}"
    )

    // Correctness: every payload byte made it to the sink, none was buffered into a Buffer
    // and surfaced via onChunkComplete.
    assertThat(success).isTrue
    assertThat(discardingSink.bytesWritten).isEqualTo(payloadBytes)
    assertThat(receivedHeaders["Content-Type"])
        .isEqualTo("application/javascript; charset=UTF-8")
    assertThat(bufferDeliveredViaComplete)
        .`as`("Body must be streamed to the sink, not delivered as a Buffer")
        .isFalse

    // Memory: peak heap must be bounded by the reader's working buffer plus a small overhead
    // (class loading, JIT scratch, JMX bookkeeping), not by the payload size. The 64 MB
    // ceiling leaves room for cross-machine variance while still proving the reader doesn't
    // retain the payload.
    //
    // We deliberately do NOT assert on `thread-allocated`: okio's SegmentPool is capped at
    // 64 KB, so streaming 100 MB through any pipeline (production or test) churns roughly
    // 100 MB of segment allocations regardless of whether the reader is well-behaved. Peak
    // heap is the property that distinguishes streaming from buffering.
    assertThat(peakHeap)
        .`as`("Peak heap should be O(buffer size), not O(payload)")
        .isLessThan(64L * 1024 * 1024)
  }

  /**
   * An [okio.Sink] that counts the bytes written to it and discards them. Used so the test's
   * assertion budget reflects only the reader's allocations, not a sink buffer's.
   */
  private class CountingDiscardingSink : Sink {
    var bytesWritten: Long = 0L
      private set

    override fun write(source: Buffer, byteCount: Long) {
      bytesWritten += byteCount
      source.skip(byteCount)
    }

    override fun flush() = Unit

    override fun timeout(): Timeout = Timeout.NONE

    override fun close() = Unit
  }
}
