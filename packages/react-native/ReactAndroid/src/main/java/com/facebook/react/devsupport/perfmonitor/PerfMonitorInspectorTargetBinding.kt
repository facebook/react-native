/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.perfmonitor

/**
 * [Experimental] Interface implemented by [com.facebook.react.runtime.ReactHostInspectorTarget]
 * exposing actions for the V2 Perf Monitor.
 */
internal interface PerfMonitorInspectorTargetBinding {
  /** Attempt to pause the current background performance trace, and open in DevTools. */
  public fun pauseAndAnalyzeBackgroundTrace()

  /** Attempt to start a new background performance trace. */
  public fun resumeBackgroundTrace()
}
