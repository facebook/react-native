/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.perfmonitor

import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.interfaces.TracingState

internal class PerfMonitorOverlayManager(
    private val devHelper: PerfMonitorDevHelper,
    private val onRequestOpenDevTools: () -> Unit,
) : PerfMonitorUpdateListener {
  private var enabled: Boolean = false
  private var view: PerfMonitorOverlayView? = null
  private var tracingState: TracingState = TracingState.ENABLEDINCDPMODE

  /** Enable the Perf Monitor overlay. */
  fun enable() {
    if (enabled) {
      return
    }

    enabled = true
    UiThreadUtil.runOnUiThread {
      val context = devHelper.currentActivity ?: return@runOnUiThread
      if (view == null) {
        view = PerfMonitorOverlayView(context, ::handleRecordingButtonPress)
      }
      view?.show()
    }
  }

  /** Disable the Perf Monitor overlay. Will remain hidden when updates are received. */
  fun disable() {
    enabled = false

    UiThreadUtil.runOnUiThread { view?.hide() }
  }

  /** Start background trace recording. */
  fun startBackgroundTrace() {
    if (!enabled) {
      return
    }

    devHelper.inspectorTarget?.let { target ->
      target.resumeBackgroundTrace()
      onRecordingStateChanged(target.getTracingState())
    }
  }

  override fun onRecordingStateChanged(state: TracingState) {
    tracingState = state
    UiThreadUtil.runOnUiThread {
      view?.updateRecordingState(state)
      view?.show()
    }
  }

  private fun handleRecordingButtonPress() {
    when (tracingState) {
      TracingState.ENABLEDINBACKGROUNDMODE -> {
        devHelper.inspectorTarget?.let { target ->
          if (!target.pauseAndAnalyzeBackgroundTrace()) {
            onRequestOpenDevTools()
          }
        }
      }
      TracingState.DISABLED -> {
        devHelper.inspectorTarget?.resumeBackgroundTrace()
      }
      TracingState.ENABLEDINCDPMODE -> Unit
    }
  }
}
