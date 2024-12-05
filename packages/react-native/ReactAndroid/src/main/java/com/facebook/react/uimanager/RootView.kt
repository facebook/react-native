/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.MotionEvent
import android.view.View

/** Interface for the root native view of a React native application. */
public interface RootView {

  /**
   * Called when a child starts a native gesture (e.g. a scroll in a ScrollView). Should be called
   * from the child's onTouchIntercepted implementation.
   */
  public fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent)

  @Deprecated(
      message = "Use onChildStartedNativeGesture with a childView parameter.",
      replaceWith = ReplaceWith("onChildStartedNativeGesture"))
  public fun onChildStartedNativeGesture(ev: MotionEvent) {
    onChildStartedNativeGesture(null, ev)
  }

  /**
   * Called when a child ends a native gesture. Should be called from the child's onTouchIntercepted
   * implementation.
   */
  public fun onChildEndedNativeGesture(childView: View, ev: MotionEvent)

  public fun handleException(t: Throwable)
}
