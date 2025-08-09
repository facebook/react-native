/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces

/**
 * [Experimental] Interface used by [com.facebook.react.devsupport.BridgeDevSupportManagerBase]
 * implement the UI for the V2 Perf Monitor overlay.
 */
internal interface PerfMonitorV2Handler {

  /** [Experimental] Update the V2 Perf Monitor overlay with the given data. */
  // FIXME(T233950466): Refactor ReactHostImpl/DevSupport setup to avoid this public API addition
  public fun unstable_updatePerfMonitor(
      interactionName: String,
      durationMs: Int,
  )
}
