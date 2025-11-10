/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.FrameMetrics
import android.view.Window
import com.facebook.soloader.SoLoader

internal class FrameTiming(private val window: Window) {
  init {
    SoLoader.loadLibrary("react_devsupportjni")
  }

  private var frameCounter: Int = 0

  private val frameMetricsListener =
      Window.OnFrameMetricsAvailableListener { _, frameMetrics, dropCount ->
        val metrics = FrameMetrics(frameMetrics)

        val paintStartTime = metrics.getMetric(FrameMetrics.INTENDED_VSYNC_TIMESTAMP)
        val totalDuration = metrics.getMetric(FrameMetrics.TOTAL_DURATION)

        val currentFrame = frameCounter++
        reportFrameTiming(
            frame = currentFrame,
            paintStartNanos = paintStartTime,
            paintEndNanos = paintStartTime + totalDuration,
        )
      }

  companion object {
    @JvmStatic
    private external fun reportFrameTiming(frame: Int, paintStartNanos: Long, paintEndNanos: Long)
  }

  private val handler = Handler(Looper.getMainLooper())

  internal fun startMonitoring() {
    frameCounter = 0
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      return
    }
    window.addOnFrameMetricsAvailableListener(frameMetricsListener, handler)
  }

  internal fun stopMonitoring() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      return
    }
    window.removeOnFrameMetricsAvailableListener(frameMetricsListener)
  }
}
