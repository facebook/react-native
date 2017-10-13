/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.scroll;

import android.os.SystemClock;

/**
 * Android has a bug where onScrollChanged is called twice per frame with the same params during
 * flings. We hack around that here by trying to detect that duplicate call and not dispatch it. See
 * https://code.google.com/p/android/issues/detail?id=39473
 */
public class OnScrollDispatchHelper {

  private static final int MIN_EVENT_SEPARATION_MS = 10;

  private int mPrevX = Integer.MIN_VALUE;
  private int mPrevY = Integer.MIN_VALUE;
  private float mXFlingVelocity = 0;
  private float mYFlingVelocity = 0;

  private long mLastScrollEventTimeMs = -(MIN_EVENT_SEPARATION_MS + 1);

  /**
   * Call from a ScrollView in onScrollChanged, returns true if this onScrollChanged is legit (not a
   * duplicate) and should be dispatched.
   */
  public boolean onScrollChanged(int x, int y) {
    long eventTime = SystemClock.uptimeMillis();
    boolean shouldDispatch =
        eventTime - mLastScrollEventTimeMs > MIN_EVENT_SEPARATION_MS ||
            mPrevX != x ||
            mPrevY != y;

    if (eventTime - mLastScrollEventTimeMs != 0) {
      mXFlingVelocity = (float) (x - mPrevX) / (eventTime - mLastScrollEventTimeMs);
      mYFlingVelocity = (float) (y - mPrevY) / (eventTime - mLastScrollEventTimeMs);
    }

    mLastScrollEventTimeMs = eventTime;
    mPrevX = x;
    mPrevY = y;

    return shouldDispatch;
  }

  public float getXFlingVelocity() {
    return this.mXFlingVelocity;
  }

  public float getYFlingVelocity() {
    return this.mYFlingVelocity;
  }
}
