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
import android.os.Process
import android.view.FrameMetrics
import android.view.Window
import com.facebook.proguard.annotations.DoNotStripAny

@DoNotStripAny
internal class FrameTimingsObserver(
    private val window: Window,
    onFrameTimingSequence: (sequence: FrameTimingSequence) -> Unit,
) {
  private val handler = Handler(Looper.getMainLooper())
  private var frameCounter: Int = 0

  private val frameMetricsListener =
      Window.OnFrameMetricsAvailableListener { _, frameMetrics, _dropCount ->
        val beginDrawingTimestamp = frameMetrics.getMetric(FrameMetrics.INTENDED_VSYNC_TIMESTAMP)
        val commitTimestamp =
            beginDrawingTimestamp + frameMetrics.getMetric(FrameMetrics.INPUT_HANDLING_DURATION)
        +frameMetrics.getMetric(FrameMetrics.ANIMATION_DURATION)
        +frameMetrics.getMetric(FrameMetrics.LAYOUT_MEASURE_DURATION)
        +frameMetrics.getMetric(FrameMetrics.DRAW_DURATION)
        +frameMetrics.getMetric(FrameMetrics.SYNC_DURATION)
        val endDrawingTimestamp =
            beginDrawingTimestamp + frameMetrics.getMetric(FrameMetrics.TOTAL_DURATION)

        onFrameTimingSequence(
            FrameTimingSequence(
                frameCounter++,
                Process.myTid(),
                beginDrawingTimestamp,
                commitTimestamp,
                endDrawingTimestamp,
            )
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
  }
}
