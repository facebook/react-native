/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import android.app.Activity
import com.facebook.infer.annotation.ThreadConfined
import com.facebook.infer.annotation.ThreadConfined.UI
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.LifecycleState

internal class ReactLifecycleStateManager(
    private val bridgelessReactStateTracker: BridgelessReactStateTracker
) {
  private var state: LifecycleState = LifecycleState.BEFORE_CREATE

  val lifecycleState: LifecycleState
    get() = state

  @ThreadConfined(UI)
  fun resumeReactContextIfHostResumed(currentContext: ReactContext, activity: Activity?) {
    if (state == LifecycleState.RESUMED) {
      bridgelessReactStateTracker.enterState("ReactContext.onHostResume()")
      currentContext.onHostResume(activity)
    }
  }

  @ThreadConfined(UI)
  fun moveToOnHostResume(currentContext: ReactContext?, activity: Activity?) {
    if (state == LifecycleState.RESUMED) {
      return
    }

    currentContext?.let { context ->
      bridgelessReactStateTracker.enterState("ReactContext.onHostResume()")
      context.onHostResume(activity)
    }
    state = LifecycleState.RESUMED
  }

  @ThreadConfined(UI)
  fun moveToOnHostPause(currentContext: ReactContext?, activity: Activity?) {
    currentContext?.let {
      when (state) {
        LifecycleState.BEFORE_CREATE -> {
          // TODO: Investigate if we can remove this transition.
          bridgelessReactStateTracker.enterState("ReactContext.onHostResume()")
          it.onHostResume(activity)
          bridgelessReactStateTracker.enterState("ReactContext.onHostPause()")
          it.onHostPause()
        }
        LifecycleState.RESUMED -> {
          bridgelessReactStateTracker.enterState("ReactContext.onHostPause()")
          it.onHostPause()
        }
        else -> {
          /* Do nothing */
        }
      }
    }

    state = LifecycleState.BEFORE_RESUME
  }

  @ThreadConfined(UI)
  fun moveToOnHostDestroy(currentContext: ReactContext?) {
    currentContext?.let {
      when (state) {
        LifecycleState.BEFORE_RESUME -> {
          bridgelessReactStateTracker.enterState("ReactContext.onHostDestroy()")
          it.onHostDestroy()
        }
        LifecycleState.RESUMED -> {
          bridgelessReactStateTracker.enterState("ReactContext.onHostPause()")
          it.onHostPause()
          bridgelessReactStateTracker.enterState("ReactContext.onHostDestroy()")
          it.onHostDestroy()
        }
        else -> {
          /* Do nothing */
        }
      }
    }

    state = LifecycleState.BEFORE_CREATE
  }
}
