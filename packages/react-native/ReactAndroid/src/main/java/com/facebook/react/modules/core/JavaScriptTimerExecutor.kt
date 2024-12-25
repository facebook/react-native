/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core

import com.facebook.react.bridge.WritableArray

/** An interface used by [JavaTimerManager] to access and call JS timers from Java. */
public interface JavaScriptTimerExecutor {
  /**
   * Calls the JS callback(s) associated with the timer ID(s). Also unregisters the callback if the
   * timer isn't recurring (e.g. unregisters for setTimeout, doesn't for setInterval).
   *
   * @param timerIDs An array of timer handles to call. Accepts an array as an optimization, to
   *   avoid unnecessary JNI calls.
   */
  public fun callTimers(timerIDs: WritableArray)

  /**
   * Invoke the JS callback registered with `requestIdleCallback`.
   *
   * @param frameTime The amount of time left in the frame, in ms.
   */
  public fun callIdleCallbacks(frameTime: Double)

  /**
   * Shows a warning message in development when environment times are out of sync.
   *
   * @param warningMessage The message to show
   */
  public fun emitTimeDriftWarning(warningMessage: String)
}
