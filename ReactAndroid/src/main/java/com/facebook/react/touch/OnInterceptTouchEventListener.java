/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.touch;

import android.view.MotionEvent;
import android.view.ViewGroup;

/**
 * Interface definition for a callback to be invoked when a onInterceptTouch is called on a
 * {@link ViewGroup}.
 */
public interface OnInterceptTouchEventListener {

  /**
   * Called when a onInterceptTouch is invoked on a view group
   * @param v The view group the onInterceptTouch has been called on
   * @param event The motion event being dispatched down the hierarchy.
   * @return Return true to steal motion event from the children and have the dispatched to this
   * view, or return false to allow motion event to be delivered to children view
   */
  public boolean onInterceptTouchEvent(ViewGroup v, MotionEvent event);

}
