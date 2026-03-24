/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.perfmonitor

import android.os.Handler
import android.os.Looper
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
  private val handler = Handler(Looper.getMainLooper())

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
      handler.removeCallbacksAndMessages(null)
    }
    UiThreadUtil.runOnUiThread {
      view?.updateRecordingState(state)
      view?.updatePerfIssueCount(perfIssueCount)
      if (state == TracingState.ENABLED_IN_CDP_MODE) {
        view?.hide()
      } else {
        view?.show()
      }
    }
  }

  override fun onPerfIssueAdded(name: String) {
    perfIssueCount++

    UiThreadUtil.runOnUiThread {
      view?.updatePerfIssueCount(perfIssueCount)
      view?.show()
    }

    handler.postDelayed(
        {
          perfIssueCount--
          UiThreadUtil.runOnUiThread {
            view?.updatePerfIssueCount(perfIssueCount)
            view?.show()
          }
        },
        PERF_ISSUE_EXPIRY_MS,
    )
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

  companion object {
    private const val PERF_ISSUE_EXPIRY_MS = 20_000L
  }
}
