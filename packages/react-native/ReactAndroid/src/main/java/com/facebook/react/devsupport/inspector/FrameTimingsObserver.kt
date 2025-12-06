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
    private val window: Window,
    private val screenshotsEnabled: Boolean,
    private val onFrameTimingSequence: (sequence: FrameTimingSequence) -> Unit,
) {
  private val handler = Handler(Looper.getMainLooper())
  private var frameCounter: Int = 0
  private var bitmapBuffer: Bitmap? = null

  private val frameMetricsListener =
      Window.OnFrameMetricsAvailableListener { _, frameMetrics, _dropCount ->
        val beginDrawingTimestamp = frameMetrics.getMetric(FrameMetrics.VSYNC_TIMESTAMP)
        val commitTimestamp =
            beginDrawingTimestamp + frameMetrics.getMetric(FrameMetrics.INPUT_HANDLING_DURATION)
        +frameMetrics.getMetric(FrameMetrics.ANIMATION_DURATION)
        +frameMetrics.getMetric(FrameMetrics.LAYOUT_MEASURE_DURATION)
        +frameMetrics.getMetric(FrameMetrics.DRAW_DURATION)
        +frameMetrics.getMetric(FrameMetrics.SYNC_DURATION)
        val endDrawingTimestamp =
            beginDrawingTimestamp + frameMetrics.getMetric(FrameMetrics.TOTAL_DURATION)

        val frameId = frameCounter++
        val threadId = Process.myTid()

        CoroutineScope(Dispatchers.Default).launch {
          val screenshot = if (screenshotsEnabled) captureScreenshot() else null

          onFrameTimingSequence(
              FrameTimingSequence(
                  frameId,
                  threadId,
                  beginDrawingTimestamp,
                  commitTimestamp,
                  endDrawingTimestamp,
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

    val decorView = window.decorView
    val width = decorView.width
    val height = decorView.height

    // Reuse bitmap if dimensions haven't changed
    val bitmap =
        bitmapBuffer?.let {
          if (it.width == width && it.height == height) {
            it
          } else {
            null
          }
        } ?: Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888).also { bitmapBuffer = it }

    PixelCopy.request(
        window,
        bitmap,
        { copyResult ->
          if (copyResult == PixelCopy.SUCCESS) {
            CoroutineScope(Dispatchers.Default).launch {
              try {
                val scaleFactor = 0.25f
                val scaledWidth = (width * scaleFactor).toInt()
                val scaledHeight = (height * scaleFactor).toInt()
                val scaledBitmap =
                    Bitmap.createScaledBitmap(bitmap, scaledWidth, scaledHeight, true)

                val outputStream = ByteArrayOutputStream()
                val compressFormat =
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
                        Bitmap.CompressFormat.WEBP_LOSSY
                    else Bitmap.CompressFormat.WEBP
                scaledBitmap.compress(compressFormat, 0, outputStream)
                val bytes = outputStream.toByteArray()
                val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                continuation.resume(base64)

                scaledBitmap.recycle()
              } catch (e: Exception) {
                continuation.resume(null)
              }
            }
          } else {
            continuation.resume(null)
          }
        },
        handler,
    )
  }

  fun start() {
    frameCounter = 0
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      return
    }

    window.addOnFrameMetricsAvailableListener(frameMetricsListener, handler)
  }

  fun stop() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      return
    }

    window.removeOnFrameMetricsAvailableListener(frameMetricsListener)
    handler.removeCallbacksAndMessages(null)

    bitmapBuffer?.recycle()
    bitmapBuffer = null
  }
}
