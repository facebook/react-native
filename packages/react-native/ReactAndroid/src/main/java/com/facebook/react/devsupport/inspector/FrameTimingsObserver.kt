/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.inspector

import android.graphics.Bitmap
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.util.Base64
import android.view.FrameMetrics
import android.view.PixelCopy
import android.view.Window
import com.facebook.proguard.annotations.DoNotStripAny
import java.io.ByteArrayOutputStream
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@DoNotStripAny
internal class FrameTimingsObserver(
    private val window: Window,
    private val screenshotsEnabled: Boolean,
    private val onFrameTimingSequence: (sequence: FrameTimingSequence) -> Unit,
) {
  // Used to schedule Window.OnFrameMetricsAvailableListener callbacks on the main thread
  private val mainHandler = Handler(Looper.getMainLooper())

  // Bounds the lifetime of async frame timing and screenshot work. Cancelled in stop() to prevent
  // emitting any further frames once tracing is torn down.
  private var tracingScope: CoroutineScope? = null

  private var frameCounter: Int = 0

  // Reused to avoid allocating a new bitmap for each capture
  private var bitmapBuffer: Bitmap? = null

  fun start() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      return
    }

    frameCounter = 0

    // Use SupervisorJob so a failed capture on one frame doesn't cancel others
    tracingScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    // Capture initial screenshot to ensure there's always at least one frame
    // recorded at the start of tracing, even if no UI changes occur
    val timestamp = System.nanoTime()
    emitFrameTiming(timestamp, timestamp)

    window.addOnFrameMetricsAvailableListener(frameMetricsListener, mainHandler)
  }

  fun stop() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      return
    }

    window.removeOnFrameMetricsAvailableListener(frameMetricsListener)
    mainHandler.removeCallbacksAndMessages(null)

    // Cancel any in-flight screenshot captures before releasing the bitmap buffer
    tracingScope?.cancel()
    tracingScope = null

    bitmapBuffer?.recycle()
    bitmapBuffer = null
  }

  private val frameMetricsListener =
      Window.OnFrameMetricsAvailableListener { _, frameMetrics, _ ->
        val beginTimestamp = frameMetrics.getMetric(FrameMetrics.VSYNC_TIMESTAMP)
        val endTimestamp = beginTimestamp + frameMetrics.getMetric(FrameMetrics.TOTAL_DURATION)
        emitFrameTiming(beginTimestamp, endTimestamp)
      }

  private fun emitFrameTiming(beginTimestamp: Long, endTimestamp: Long) {
    // Guard against calls arriving after stop() has cancelled the scope
    val scope = tracingScope ?: return

    val frameId = frameCounter++
    val threadId = Process.myTid()

    scope.launch {
      val screenshot = if (screenshotsEnabled) captureScreenshot() else null

      onFrameTimingSequence(
          FrameTimingSequence(
              frameId,
              threadId,
              beginTimestamp,
              endTimestamp,
              screenshot,
          )
      )
    }
  }

  private suspend fun captureScreenshot(): String? =
      withContext(Dispatchers.Main) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
          return@withContext null
        }

        val decorView = window.decorView
        val width = decorView.width
        val height = decorView.height

        // Reuse bitmap if dimensions haven't changed
        val bitmap =
            bitmapBuffer?.let {
              if (it.width == width && it.height == height) {
                it
              } else {
                it.recycle()
                null
              }
            }
                ?: Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888).also {
                  bitmapBuffer = it
                }

        // Suspend for PixelCopy callback
        val copySuccess = suspendCoroutine { continuation ->
          PixelCopy.request(
              window,
              bitmap,
              { copyResult -> continuation.resume(copyResult == PixelCopy.SUCCESS) },
              mainHandler,
          )
        }

        if (!copySuccess) {
          return@withContext null
        }

        // Switch to background thread for CPU-intensive scaling/encoding work
        withContext(Dispatchers.Default) {
          var scaledBitmap: Bitmap? = null
          try {
            val scaleFactor = 0.25f
            val scaledWidth = (width * scaleFactor).toInt()
            val scaledHeight = (height * scaleFactor).toInt()
            scaledBitmap = Bitmap.createScaledBitmap(bitmap, scaledWidth, scaledHeight, true)

            val compressFormat =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) Bitmap.CompressFormat.WEBP_LOSSY
                else Bitmap.CompressFormat.WEBP

            ByteArrayOutputStream().use { outputStream ->
              scaledBitmap.compress(compressFormat, 0, outputStream)
              Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
            }
          } catch (e: Exception) {
            null
          } finally {
            scaledBitmap?.recycle()
          }
        }
      }
}
