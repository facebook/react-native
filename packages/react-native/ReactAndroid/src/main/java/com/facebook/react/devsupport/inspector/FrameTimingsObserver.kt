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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@DoNotStripAny
internal class FrameTimingsObserver(
    private val screenshotsEnabled: Boolean,
    private val onFrameTimingSequence: (sequence: FrameTimingSequence) -> Unit,
) {
  private val isSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N

  private val mainHandler = Handler(Looper.getMainLooper())
  private var frameCounter: Int = 0
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

    currentWindow?.addOnFrameMetricsAvailableListener(frameMetricsListener, mainHandler)
  }

  fun stop() {
    if (!isSupported) {
      return
    }

    isStarted = false

    currentWindow?.removeOnFrameMetricsAvailableListener(frameMetricsListener)
    mainHandler.removeCallbacksAndMessages(null)
  }

  fun setCurrentWindow(window: Window?) {
    if (!isSupported || currentWindow === window) {
      return
    }

    currentWindow?.removeOnFrameMetricsAvailableListener(frameMetricsListener)
    currentWindow = window
    if (isStarted) {
      currentWindow?.addOnFrameMetricsAvailableListener(frameMetricsListener, mainHandler)
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

    if (screenshotsEnabled) {
      // Initiate PixelCopy immediately on the main thread, while still in the current frame,
      // then process and emit asynchronously once the copy is complete.
      captureScreenshot { screenshot ->
        CoroutineScope(Dispatchers.Default).launch {
          onFrameTimingSequence(
              FrameTimingSequence(frameId, threadId, beginTimestamp, endTimestamp, screenshot)
          )
        }
      }
    } else {
      CoroutineScope(Dispatchers.Default).launch {
        onFrameTimingSequence(
            FrameTimingSequence(frameId, threadId, beginTimestamp, endTimestamp, null)
        )
      }
    }
  }

  // Must be called from the main thread so that PixelCopy captures the current frame.
  private fun captureScreenshot(callback: (String?) -> Unit) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      callback(null)
      return
    }

    val window = currentWindow
    if (window == null) {
      callback(null)
      return
    }

    val decorView = window.decorView
    val width = decorView.width
    val height = decorView.height
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)

    PixelCopy.request(
        window,
        bitmap,
        { copyResult ->
          if (copyResult == PixelCopy.SUCCESS) {
            CoroutineScope(Dispatchers.Default).launch {
              callback(encodeScreenshot(window, bitmap, width, height))
            }
          } else {
            bitmap.recycle()
            callback(null)
          }
        },
        mainHandler,
    )
  }

  private fun encodeScreenshot(window: Window, bitmap: Bitmap, width: Int, height: Int): String? {
    var scaledBitmap: Bitmap? = null
    return try {
      val density = window.context.resources.displayMetrics.density
      val scaledWidth = (width / density * SCREENSHOT_SCALE_FACTOR).toInt()
      val scaledHeight = (height / density * SCREENSHOT_SCALE_FACTOR).toInt()
      scaledBitmap = Bitmap.createScaledBitmap(bitmap, scaledWidth, scaledHeight, true)

      val compressFormat =
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) Bitmap.CompressFormat.WEBP_LOSSY
          else Bitmap.CompressFormat.JPEG

      ByteArrayOutputStream().use { outputStream ->
        scaledBitmap.compress(compressFormat, SCREENSHOT_QUALITY, outputStream)
        Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
      }
    } catch (e: Exception) {
      null
    } finally {
      scaledBitmap?.recycle()
      bitmap.recycle()
    }
  }

  companion object {
    private const val SCREENSHOT_SCALE_FACTOR = 0.75f
    private const val SCREENSHOT_QUALITY = 80
  }
}
