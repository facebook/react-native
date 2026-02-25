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
import kotlinx.coroutines.launch

@DoNotStripAny
internal class FrameTimingsObserver(
    private val screenshotsEnabled: Boolean,
    private val onFrameTimingSequence: (sequence: FrameTimingSequence) -> Unit,
) {
  private val isSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N

  private val handler = Handler(Looper.getMainLooper())
  private var frameCounter: Int = 0
  private var bitmapBuffer: Bitmap? = null
  private var isStarted: Boolean = false

  @Volatile private var currentWindow: Window? = null

  fun start() {
    if (!isSupported) {
      return
    }

    frameCounter = 0
    isStarted = true

    // Capture initial screenshot to ensure there's always at least one frame
    // recorded at the start of tracing, even if no UI changes occur
    val timestamp = System.nanoTime()
    emitFrameTiming(timestamp, timestamp)

    currentWindow?.addOnFrameMetricsAvailableListener(frameMetricsListener, handler)
  }

  fun stop() {
    if (!isSupported) {
      return
    }

    isStarted = false

    currentWindow?.removeOnFrameMetricsAvailableListener(frameMetricsListener)
    handler.removeCallbacksAndMessages(null)

    bitmapBuffer?.recycle()
    bitmapBuffer = null
  }

  fun setCurrentWindow(window: Window?) {
    if (!isSupported || currentWindow === window) {
      return
    }

    currentWindow?.removeOnFrameMetricsAvailableListener(frameMetricsListener)
    currentWindow = window
    if (isStarted) {
      currentWindow?.addOnFrameMetricsAvailableListener(frameMetricsListener, handler)
    }
  }

  private val frameMetricsListener =
      Window.OnFrameMetricsAvailableListener { _, frameMetrics, _ ->
        val beginTimestamp = frameMetrics.getMetric(FrameMetrics.VSYNC_TIMESTAMP)
        val endTimestamp = beginTimestamp + frameMetrics.getMetric(FrameMetrics.TOTAL_DURATION)
        emitFrameTiming(beginTimestamp, endTimestamp)
      }

  private fun emitFrameTiming(beginTimestamp: Long, endTimestamp: Long) {
    val frameId = frameCounter++
    val threadId = Process.myTid()

    CoroutineScope(Dispatchers.Default).launch {
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

  private suspend fun captureScreenshot(): String? = suspendCoroutine { continuation ->
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      continuation.resume(null)
      return@suspendCoroutine
    }

    val window = currentWindow
    if (window == null) {
      continuation.resume(null)
      return@suspendCoroutine
    }

    val decorView = window.decorView
    val width = decorView.width
    val height = decorView.height

    // Reuse bitmap if dimensions haven't changed
    val bitmap =
        bitmapBuffer?.takeIf { it.width == width && it.height == height }
            ?: run {
              bitmapBuffer?.recycle()
              Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888).also { bitmapBuffer = it }
            }

    PixelCopy.request(
        window,
        bitmap,
        { copyResult ->
          if (copyResult == PixelCopy.SUCCESS) {
            CoroutineScope(Dispatchers.Default).launch {
              var scaledBitmap: Bitmap? = null
              try {
                val density = window.context.resources.displayMetrics.density
                val scaledWidth = (width / density * SCREENSHOT_SCALE_FACTOR).toInt()
                val scaledHeight = (height / density * SCREENSHOT_SCALE_FACTOR).toInt()
                scaledBitmap = Bitmap.createScaledBitmap(bitmap, scaledWidth, scaledHeight, true)

                val compressFormat =
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
                        Bitmap.CompressFormat.WEBP_LOSSY
                    else Bitmap.CompressFormat.JPEG

                val base64 =
                    ByteArrayOutputStream().use { outputStream ->
                      scaledBitmap.compress(compressFormat, SCREENSHOT_QUALITY, outputStream)
                      Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
                    }

                continuation.resume(base64)
              } catch (e: Exception) {
                continuation.resume(null)
              } finally {
                scaledBitmap?.recycle()
              }
            }
          } else {
            continuation.resume(null)
          }
        },
        handler,
    )
  }

  companion object {
    private const val SCREENSHOT_SCALE_FACTOR = 0.75f
    private const val SCREENSHOT_QUALITY = 80
  }
}
