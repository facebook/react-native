/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces

/** [Experimental] Interface to manage the V2 Perf Monitor overlay. */
internal interface PerfMonitorOverlayManager {
  data class PerfMonitorUpdateData(
      val eventName: String,
      val durationMs: Int,
      val responsivenessScore: Int,
      val ttl: Int
  )

  /** Enable the Perf Monitor overlay. Will be shown when updates are received. */
  public fun enable()

  /** Disable the Perf Monitor overlay. Will remain hidden when updates are received. */
  public fun disable()

  /** Reset the Perf Monitor overlay, e.g. after a reload. */
  public fun reset()

  /** Update the state of the Perf Monitor overlay. */
  public fun update(data: PerfMonitorUpdateData)
}
