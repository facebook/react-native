/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import android.view.Choreographer
import com.facebook.react.bridge.JSExceptionHandler
import com.facebook.react.bridge.ReactContext

public abstract class GuardedFrameCallback
protected constructor(private val exceptionHandler: JSExceptionHandler) :
    Choreographer.FrameCallback {

  protected constructor(reactContext: ReactContext) : this(reactContext.exceptionHandler)

  override public fun doFrame(frameTimeNanos: Long) {
    try {
      doFrameGuarded(frameTimeNanos)
    } catch (e: RuntimeException) {
      exceptionHandler.handleException(e)
    }
  }

  /**
   * Like the standard doFrame but RuntimeExceptions will be caught and passed to
   * [ReactContext#handleException(RuntimeException)].
   */
  protected abstract fun doFrameGuarded(frameTimeNanos: Long)
}
