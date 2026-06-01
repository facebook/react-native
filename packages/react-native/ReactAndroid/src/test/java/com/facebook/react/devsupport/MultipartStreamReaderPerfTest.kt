/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okio versions

package com.facebook.react.devsupport

import okio.Buffer
import okio.Okio
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.experimental.categories.Category

/**
 * Performance & memory regression test for [MultipartStreamReader] against a 100 MB JavaScript
 * payload. Captures a baseline today so a future streaming refactor can tighten the budgets.
 *
 * Run with:
 * ```
 * ./gradlew :packages:react-native:ReactAndroid:testDebugUnitTest \
 *     -PrunPerfTests -Preact.internal.useHermesNightly=true \
 *     --tests "*MultipartStreamReaderPerfTest"
 * ```
 *
 * Assertions are intentionally loose: they capture today's behaviour (where the reader buffers
 * the entire body in heap) and bound it to ~2.5× the payload. After refactoring to a true
 * streaming implementation, the asserts should be tightened to a small multiple of the read
 * buffer size (e.g. < 4 MB allocated, < 8 MB peak heap).
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
  fun reads100MBBundleWithBoundedAllocation() {
    val syntheticSource = LargeMultipartSource(boundary, payloadBytes)
    val bufferedSource = Okio.buffer(syntheticSource)
    val reader = MultipartStreamReader(bufferedSource, boundary)

    var receivedBytes = 0L
    var sawLastChunk = false
    val listener =
        object : MultipartStreamReader.ChunkListener {
          override fun onChunkComplete(
              headers: Map<String, String>,
              body: Buffer,
              isLastChunk: Boolean,
          ) {
            receivedBytes = body.size()
            sawLastChunk = isLastChunk
            // Drain so we don't keep the body alive past this call.
            body.clear()
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

    val elapsedMs = (System.nanoTime() - nanosBefore) / 1_000_000
    val allocated = AllocationProbe.allocatedBytes(threadId) - allocBefore
    val peakHeap = AllocationProbe.peakHeapBytes()

    println(
        "[MultipartStreamReaderPerfTest] payload=${AllocationProbe.fmt(payloadBytes)} " +
            "elapsed=${elapsedMs}ms " +
            "thread-allocated=${AllocationProbe.fmt(allocated)} " +
            "peak-heap=${AllocationProbe.fmt(peakHeap)}"
    )

    // Correctness
    assertThat(success).isTrue
    assertThat(sawLastChunk).isTrue
    assertThat(receivedBytes).isEqualTo(payloadBytes)

    // Baseline budgets — loose on purpose. Tighten after the streaming refactor.
    assertThat(allocated)
        .`as`("Thread-allocated bytes should not exceed 3x the payload (baseline)")
        .isLessThan(payloadBytes * 3)
    assertThat(peakHeap)
        .`as`("Peak heap should not exceed 4x the payload (baseline)")
        .isLessThan(payloadBytes * 4)
  }
}
