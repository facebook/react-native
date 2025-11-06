/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.perfmonitor

import com.facebook.react.devsupport.interfaces.TracingState

/** [Experimental] An interface for subscribing to updates for the V2 Perf Monitor. */
internal interface PerfMonitorUpdateListener {
  /** Called when the recording state of the background performance trace has changed. */
  fun onRecordingStateChanged(state: TracingState)

  /** Called when a new Performance Issue is added. */
  fun onPerfIssueAdded(name: String)
}
