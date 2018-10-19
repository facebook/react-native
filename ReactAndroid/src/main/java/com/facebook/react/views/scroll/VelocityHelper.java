/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import javax.annotation.Nullable;

import android.view.MotionEvent;
import android.view.VelocityTracker;

/**
 * This Class helps to calculate the velocity for all ScrollView. The x and y velocity
 * will later on send to ReactScrollViewHelper for further use.
 *
 */
public class VelocityHelper {

  private @Nullable VelocityTracker mVelocityTracker;
  private float mXVelocity;
  private float mYVelocity;

  /**
   * Call from a ScrollView in onTouchEvent.
   * Calculating the velocity for END_DRAG movement and send them back to react ScrollResponder.js
   * */
  public void calculateVelocity(MotionEvent ev) {
    int action = ev.getAction() & MotionEvent.ACTION_MASK;
    if (mVelocityTracker == null) {
      mVelocityTracker = VelocityTracker.obtain();
    }
    mVelocityTracker.addMovement(ev);

    switch (action) {
      case MotionEvent.ACTION_UP:
      case MotionEvent.ACTION_CANCEL: {
        // Calculate velocity on END_DRAG
        mVelocityTracker.computeCurrentVelocity(1); // points/millisecond
        mXVelocity = mVelocityTracker.getXVelocity();
        mYVelocity = mVelocityTracker.getYVelocity();

        if (mVelocityTracker != null) {
          mVelocityTracker.recycle();
          mVelocityTracker = null;
        }
        break;
      }
    }
  }

  /* Needs to call ACTION_UP/CANCEL to update the mXVelocity */
  public float getXVelocity() {
    return mXVelocity;
  }

  /* Needs to call ACTION_UP/CANCEL to update the mYVelocity */
  public float getYVelocity() {
    return mYVelocity;
  }
}
