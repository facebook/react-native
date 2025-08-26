/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.perfmonitor

import com.facebook.react.bridge.UiThreadUtil

internal class PerfMonitorOverlayManager(
    private val devHelper: PerfMonitorDevHelper,
    private val onRequestOpenDevTools: () -> Unit,
) : PerfMonitorUpdateListener {
  private var enabled: Boolean = false
  private var initialized: Boolean = false
  private var view: PerfMonitorOverlayView? = null
  private var recordingState: PerfMonitorUpdateListener.BackgroundTracingState =
      PerfMonitorUpdateListener.BackgroundTracingState.DISABLED

  fun init() {
    if (initialized || !enabled) {
      return
    }

    UiThreadUtil.runOnUiThread {
      devHelper.currentActivity?.let { activity ->
        view = PerfMonitorOverlayView(activity, ::handleRecordingButtonPress)

        // Start background tracing
        devHelper.inspectorTarget?.resumeBackgroundTrace()
        onRecordingStateChanged(PerfMonitorUpdateListener.BackgroundTracingState.RUNNING)

        view?.show()
        initialized = true
      }
    }
  }

  /** Enable the Perf Monitor overlay. Will be shown when updates are received. */
  fun enable() {
    enabled = true

    if (initialized) {
      UiThreadUtil.runOnUiThread { view?.show() }
    }
  }

  /** Disable the Perf Monitor overlay. Will remain hidden when updates are received. */
  fun disable() {
    UiThreadUtil.runOnUiThread { view?.hide() }
  }

  /** Reset the Perf Monitor overlay, e.g. after a reload. */
  fun reset() {
    UiThreadUtil.runOnUiThread { view?.resetState() }
  }

  override fun onNewFocusedEvent(data: PerfMonitorUpdateListener.LongTaskEventData) {
    view?.updateFocusedEvent(data)
  }

  override fun onRecordingStateChanged(state: PerfMonitorUpdateListener.BackgroundTracingState) {
    recordingState = state
    view?.updateRecordingState(state)
  }

  private fun handleRecordingButtonPress() {
    when (recordingState) {
      PerfMonitorUpdateListener.BackgroundTracingState.RUNNING -> {
        devHelper.inspectorTarget?.pauseAndAnalyzeBackgroundTrace()
        onRequestOpenDevTools()
      }
      PerfMonitorUpdateListener.BackgroundTracingState.STOPPED -> {
        devHelper.inspectorTarget?.resumeBackgroundTrace()
      }
      PerfMonitorUpdateListener.BackgroundTracingState.DISABLED -> Unit
    }
  }
}
