/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.touch

import android.view.MotionEvent
import android.view.ViewGroup

/**
 * Interface definition for a callback to be invoked when a onInterceptTouch is called on a
 * [ViewGroup].
 */
internal fun interface OnInterceptTouchEventListener {

  /**
   * Called when a onInterceptTouch is invoked on a view group.
   *
   * @param view The view group the onInterceptTouch has been called on.
   * @param event The motion event being dispatched down the hierarchy.
   * @return Return true to steal motion event from the children and have the dispatched to this
   *   view, or return false to allow motion event to be delivered to children view
   */
  fun onInterceptTouchEvent(view: ViewGroup, event: MotionEvent): Boolean
}
