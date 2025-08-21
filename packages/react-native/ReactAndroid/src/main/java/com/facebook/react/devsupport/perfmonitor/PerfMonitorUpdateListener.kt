/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.perfmonitor

/** [Experimental] An interface for subscribing to updates for the V2 Perf Monitor. */
internal interface PerfMonitorUpdateListener {
  data class LongTaskEventData(
      val durationMs: Int,
      val responsivenessScore: Int,
      val ttl: Int,
  )

  /** Called when a new active performance event should be displayed. */
  fun onNewFocusedEvent(data: LongTaskEventData)
}
