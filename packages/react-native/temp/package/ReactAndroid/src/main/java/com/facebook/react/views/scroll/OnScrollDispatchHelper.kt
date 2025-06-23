/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.os.SystemClock

/**
 * Android has a bug where onScrollChanged is called twice per frame with the same params during
 * flings. We hack around that here by trying to detect that duplicate call and not dispatch it. See
 * https://code.google.com/p/android/issues/detail?id=39473
 */
public class OnScrollDispatchHelper {

  private var prevX = Int.MIN_VALUE
  private var prevY = Int.MIN_VALUE
  public var xFlingVelocity: Float = 0f
    private set

  public var yFlingVelocity: Float = 0f
    private set

  private var lastScrollEventTimeMs = -(MIN_EVENT_SEPARATION_MS + 1).toLong()

  /**
   * Call from a ScrollView in onScrollChanged, returns true if this onScrollChanged is legit (not a
   * duplicate) and should be dispatched.
   */
  public fun onScrollChanged(x: Int, y: Int): Boolean {
    val eventTime = SystemClock.uptimeMillis()
    val shouldDispatch =
        eventTime - lastScrollEventTimeMs > MIN_EVENT_SEPARATION_MS || prevX != x || prevY != y
    if (eventTime - lastScrollEventTimeMs != 0L) {
      xFlingVelocity = (x - prevX).toFloat() / (eventTime - lastScrollEventTimeMs)
      yFlingVelocity = (y - prevY).toFloat() / (eventTime - lastScrollEventTimeMs)
    }
    lastScrollEventTimeMs = eventTime
    prevX = x
    prevY = y
    return shouldDispatch
  }

  private companion object {
    private const val MIN_EVENT_SEPARATION_MS = 10
  }
}
