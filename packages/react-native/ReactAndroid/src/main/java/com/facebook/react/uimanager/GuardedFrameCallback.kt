/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.Choreographer
import com.facebook.react.bridge.ReactContext

/**
 * Abstract base for a Choreographer FrameCallback that should have any RuntimeExceptions it throws
 * handled by the [JSExceptionHandler] registered if the app is in dev mode.
 */
public abstract class GuardedFrameCallback
protected constructor(private val reactContext: ReactContext) : Choreographer.FrameCallback {

  override public fun doFrame(frameTimeNanos: Long) {
    try {
      doFrameGuarded(frameTimeNanos)
    } catch (e: RuntimeException) {
      reactContext.handleException(e)
    }
  }

  /**
   * Like the standard doFrame but RuntimeExceptions will be caught and passed to
   * [ReactContext#handleException(RuntimeException)].
   */
  protected abstract fun doFrameGuarded(frameTimeNanos: Long)
}
