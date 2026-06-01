/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp/okio versions

package com.facebook.react.devsupport

import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import java.io.File
import java.nio.file.Files
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference
import okhttp3.Interceptor
import okhttp3.MediaType
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody
import okio.Okio
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.experimental.categories.Category

/**
 * End-to-end performance & memory regression test for [BundleDownloader] against a 100 MB JS
 * bundle. The OkHttp call is short-circuited by an [Interceptor] that returns a synthetic
 * `multipart/mixed` [ResponseBody] backed by [LargeMultipartSource], so no socket is involved
 * and the server-side never holds the payload.
 *
 * Run with:
 * ```
 * ./gradlew :packages:react-native:ReactAndroid:testDebugUnitTest \
 *     -PrunPerfTests -Preact.internal.useHermesNightly=true \
 *     --tests "*BundleDownloaderPerfTest"
 * ```
 *
 * Captures today's baseline. After streaming refactor, tighten the allocation budget.
 */
@Category(PerformanceTest::class)
class BundleDownloaderPerfTest {

  private val boundary = "perf_boundary"
  private val payloadBytes = 100L * 1024 * 1024 // 100 MB
  private val bundleUrl = "http://localhost/perf.bundle"

  private lateinit var tmpDir: File
  private lateinit var outputFile: File

  @Before
  fun setUp() {
    AllocationProbe.requireSupported()
    tmpDir = Files.createTempDirectory("bundle-downloader-perf").toFile()
    outputFile = File(tmpDir, "bundle.js")
  }

  @After
  fun tearDown() {
    tmpDir.deleteRecursively()
  }

  @Test
  fun downloads100MBMultipartBundleWithBoundedAllocation() {
    val workerThreadId = AtomicLong(-1L)
    val workerAllocStart = AtomicLong(0L)

    val syntheticInterceptor = Interceptor { chain ->
      // We're on the OkHttp dispatcher thread at this point — capture it so we can measure the
      // allocations the read path actually attributes to it.
      val tid = Thread.currentThread().id
      workerThreadId.set(tid)
      workerAllocStart.set(AllocationProbe.allocatedBytes(tid))

      val mediaType = MediaType.parse("multipart/mixed; boundary=\"$boundary\"")
      val source = Okio.buffer(LargeMultipartSource(boundary, payloadBytes))
      val body: ResponseBody = ResponseBody.create(mediaType, -1L, source)

      Response.Builder()
          .request(chain.request())
          .protocol(Protocol.HTTP_1_1)
          .code(200)
          .message("OK")
          .header("content-type", "multipart/mixed; boundary=\"$boundary\"")
          .body(body)
          .build()
    }

    val client = OkHttpClient.Builder().addInterceptor(syntheticInterceptor).build()
    val downloader = BundleDownloader(client)

    val done = CountDownLatch(1)
    val failure = AtomicReference<Throwable?>(null)
    val listener =
        object : DevBundleDownloadListener {
          override fun onSuccess() = done.countDown()

          override fun onProgress(status: String?, done: Int?, total: Int?, percent: Int?) = Unit

          override fun onFailure(cause: Exception) {
            failure.set(cause)
            done.countDown()
          }
        }

    val testThreadId = Thread.currentThread().id
    AllocationProbe.settle()
    AllocationProbe.resetPeakHeap()
    val testAllocBefore = AllocationProbe.allocatedBytes(testThreadId)
    val totalAllocBefore = AllocationProbe.totalAllocatedBytes()
    val nanosBefore = System.nanoTime()

    downloader.downloadBundleFromURL(listener, outputFile, bundleUrl, BundleDownloader.BundleInfo())

    assertThat(done.await(120, TimeUnit.SECONDS))
        .`as`("Download did not complete within timeout")
        .isTrue
    assertThat(failure.get()).isNull()

    val elapsedMs = (System.nanoTime() - nanosBefore) / 1_000_000
    val testAllocated = AllocationProbe.allocatedBytes(testThreadId) - testAllocBefore
    val totalAllocated = AllocationProbe.totalAllocatedBytes() - totalAllocBefore
    val workerAllocated =
        if (workerThreadId.get() >= 0)
            AllocationProbe.allocatedBytes(workerThreadId.get()) - workerAllocStart.get()
        else 0L
    val peakHeap = AllocationProbe.peakHeapBytes()

    println(
        "[BundleDownloaderPerfTest] payload=${AllocationProbe.fmt(payloadBytes)} " +
            "elapsed=${elapsedMs}ms " +
            "test-thread-allocated=${AllocationProbe.fmt(testAllocated)} " +
            "worker-thread-allocated=${AllocationProbe.fmt(workerAllocated)} " +
            "all-threads-allocated=${AllocationProbe.fmt(totalAllocated)} " +
            "peak-heap=${AllocationProbe.fmt(peakHeap)} " +
            "output-size=${AllocationProbe.fmt(outputFile.length())}"
    )

    // Correctness: the file on disk equals the synthetic payload (post-multipart parsing).
    assertThat(outputFile.length()).isEqualTo(payloadBytes)

    // Baseline budgets — loose on purpose. Tighten after the streaming refactor.
    assertThat(totalAllocated)
        .`as`("Total bytes allocated across all threads should not exceed 4x the payload")
        .isLessThan(payloadBytes * 4)
    assertThat(peakHeap)
        .`as`("Peak heap should not exceed 4x the payload (baseline)")
        .isLessThan(payloadBytes * 4)
  }
}
