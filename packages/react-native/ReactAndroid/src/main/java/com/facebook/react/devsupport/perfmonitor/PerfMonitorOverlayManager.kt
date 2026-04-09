/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.perfmonitor

import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.inspector.TracingState

internal class PerfMonitorOverlayManager(
    private val devHelper: PerfMonitorDevHelper,
    private val onRequestOpenDevTools: () -> Unit,
) : PerfMonitorUpdateListener {
  private var enabled: Boolean = false

  /** Whether the Perf Monitor overlay is currently enabled. */
  val isEnabled: Boolean
    get() = enabled

  private var view: PerfMonitorOverlayView? = null
  private var tracingState: TracingState = TracingState.ENABLED_IN_CDP_MODE
  private var perfIssueCount: Int = 0

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

  /** Stop background trace recording. */
  fun stopBackgroundTrace() {
    if (!enabled) {
      return
    }

    devHelper.inspectorTarget?.let { target ->
      target.stopBackgroundTrace()
      onRecordingStateChanged(target.getTracingState())
    }
  }

  override fun onRecordingStateChanged(state: TracingState) {
    tracingState = state
    if (state != TracingState.DISABLED) {
      perfIssueCount = 0
    }
    UiThreadUtil.runOnUiThread {
      view?.updateRecordingState(state)
      view?.updatePerfIssueCount(perfIssueCount)
      view?.show()
    }
  }

  override fun onPerfIssueAdded(name: String) {
    UiThreadUtil.runOnUiThread {
      view?.updatePerfIssueCount(++perfIssueCount)
      view?.show()
    }
  }

  private fun handleRecordingButtonPress() {
    when (tracingState) {
      TracingState.ENABLED_IN_BACKGROUND_MODE -> {
        devHelper.inspectorTarget?.let { target ->
          if (!target.pauseAndAnalyzeBackgroundTrace()) {
            onRequestOpenDevTools()
          }
        }
      }
      TracingState.DISABLED -> {
        devHelper.inspectorTarget?.resumeBackgroundTrace()
      }
      TracingState.ENABLED_IN_CDP_MODE -> Unit
    }
  }
}
