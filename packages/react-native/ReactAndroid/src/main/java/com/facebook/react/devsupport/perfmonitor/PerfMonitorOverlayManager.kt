/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.perfmonitor

import android.content.Context
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.interfaces.TracingState
import javax.inject.Provider

internal class PerfMonitorOverlayManager(
    private val devHelper: PerfMonitorDevHelper,
    private val contextProvider: Provider<Context?>,
    private val onRequestOpenDevTools: () -> Unit,
) : PerfMonitorUpdateListener {
  private var enabled: Boolean = false
  private var initialized: Boolean = false
  private var view: PerfMonitorOverlayView? = null
  private var tracingState: TracingState = TracingState.ENABLEDINCDPMODE

  private fun init() {
    if (initialized || !enabled) {
      return
    }

    UiThreadUtil.runOnUiThread {
      val context = contextProvider.get() ?: return@runOnUiThread
      view = PerfMonitorOverlayView(context, ::handleRecordingButtonPress)

      // Start background tracing
      devHelper.inspectorTarget?.resumeBackgroundTrace()

      view?.show()
      initialized = true
    }
  }

  /** Enable the Perf Monitor overlay. Will be shown when updates are received. */
  fun enable() {
    enabled = true
    init()
  }

  /** Disable the Perf Monitor overlay. Will remain hidden when updates are received. */
  fun disable() {
    UiThreadUtil.runOnUiThread { view?.hide() }
    view = null
    enabled = false
  }

  /** Reset the Perf Monitor overlay, e.g. after a reload. */
  fun reset() {
    // Update with current recording state
    onRecordingStateChanged(
        devHelper.inspectorTarget?.getTracingState() ?: TracingState.ENABLEDINCDPMODE
    )
  }

  override fun onRecordingStateChanged(state: TracingState) {
    tracingState = state
    view?.updateRecordingState(state)
  }

  private fun handleRecordingButtonPress() {
    when (tracingState) {
      TracingState.ENABLEDINBACKGROUNDMODE -> {
        devHelper.inspectorTarget?.pauseAndAnalyzeBackgroundTrace()
        onRequestOpenDevTools()
      }
      TracingState.DISABLED -> {
        devHelper.inspectorTarget?.resumeBackgroundTrace()
      }
      TracingState.ENABLEDINCDPMODE -> Unit
    }
  }
}
