/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.uimanager.GuardedFrameCallback
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.synchronized

internal fun interface AnimationFrameCallback {
  fun onAnimationFrame(frameTimeMs: Double)
}

internal class AnimationBackendChoreographer(
    reactApplicationContext: ReactApplicationContext,
) {

  var frameCallback: AnimationFrameCallback? = null
  private var lastFrameTimeMs: Double = 0.0
  private val reactChoreographer: ReactChoreographer = ReactChoreographer.getInstance()
  private val choreographerCallback: GuardedFrameCallback =
      object : GuardedFrameCallback(reactApplicationContext) {
        override fun doFrameGuarded(frameTimeNanos: Long) {
          executeFrameCallback(frameTimeNanos)
        }
      }
  private val callbackPosted: AtomicBoolean = AtomicBoolean()
  private val paused: AtomicBoolean = AtomicBoolean(true)

  /*
   * resume() and pause() should be called with the same lock to avoid race conditions.
   */

  fun resume() {
    if (paused.getAndSet(false)) {
      scheduleCallback()
    }
  }

  fun pause() {
    synchronized(paused) {
      if (!paused.getAndSet(true) && callbackPosted.getAndSet(false)) {
        reactChoreographer.removeFrameCallback(
            ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE,
            choreographerCallback,
        )
      }
    }
  }

  private fun scheduleCallback() {
    synchronized(paused) {
      if (!paused.get() && !callbackPosted.getAndSet(true)) {
        reactChoreographer.postFrameCallback(
            ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE,
            choreographerCallback,
        )
      }
    }
  }

  private fun executeFrameCallback(frameTimeNanos: Long) {
    callbackPosted.set(false)
    val currentFrameTimeMs = calculateTimestamp(frameTimeNanos)
    // It is possible for ChoreographerCallback to be executed twice within the same frame
    // due to frame drops. If this occurs, the additional callback execution should be ignored.
    if (currentFrameTimeMs > lastFrameTimeMs) {
      frameCallback?.onAnimationFrame(currentFrameTimeMs)
    }

    lastFrameTimeMs = currentFrameTimeMs
    scheduleCallback()
  }

  private fun calculateTimestamp(frameTimeNanos: Long): Double {
    val nanosecondsInMilliseconds = 1000000.0
    return frameTimeNanos / nanosecondsInMilliseconds
  }
}
