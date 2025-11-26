/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.inspector

import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.FrameMetrics
import android.view.Window
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.soloader.SoLoader

@DoNotStripAny
internal class FrameTimingsObserver(private val window: Window) {
  private val handler = Handler(Looper.getMainLooper())
  private var frameCounter: Int = 0

  private external fun setLayerTreeId(frame: String, layerTreeId: Int)

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

  fun start() {
    frameCounter = 0
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      return
    }

    window.addOnFrameMetricsAvailableListener(frameMetricsListener, handler)

    // Hardcoded frame identfier and layerTreeId. Needed for DevTools to
    // begin parsing frame events.
    setLayerTreeId("", 1)
  }

  fun stop() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      return
    }

    window.removeOnFrameMetricsAvailableListener(frameMetricsListener)
    handler.removeCallbacksAndMessages(null)
  }

  private companion object {
    init {
      SoLoader.loadLibrary("react_devsupportjni")
    }

    @JvmStatic
    private external fun reportFrameTiming(frame: Int, paintStartNanos: Long, paintEndNanos: Long)
  }
}
