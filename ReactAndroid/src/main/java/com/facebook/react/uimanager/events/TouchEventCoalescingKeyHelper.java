/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager.events;

import android.util.SparseIntArray;

/**
 * Utility for determining coalescing keys for TouchEvents. To preserve proper ordering of events,
 * move events should only be coalesced if there has been no up/down event between them (this
 * basically only applies to multitouch since for single touches an up would signal the end of the
 * gesture). To illustrate to kind of coalescing we want, imagine we are coalescing the following
 * touch stream:
 *
 * (U = finger up, D = finger down, M = move)
 * D MMMMM D MMMMMMMMMMMMMM U MMMMM D MMMMMM U U
 *
 * We want to make sure to coalesce this as
 *
 * D M D M U M D U U
 *
 * and *not*
 *
 * D D U M D U U
 *
 * To accomplish this, this class provides a way to initialize a coalescing key for a gesture and
 * then increment it for every pointer up/down that occurs during that single gesture.
 *
 * We identify a single gesture based on {@link android.view.MotionEvent#getDownTime()} which will
 * stay constant for a given set of related touches on a single view.
 *
 * NB: even though down time is a long, we cast as an int using the least significant bits as the
 * identifier. In practice, we will not be coalescing over a time range where the most significant
 * bits of that time range matter. This would require a gesture that lasts Integer.MAX_VALUE * 2 ms,
 * or ~48 days.
 *
 * NB: we assume two gestures cannot begin at the same time.
 *
 * NB: this class should only be used from the UI thread.
 */
public class TouchEventCoalescingKeyHelper {

  private final SparseIntArray mDownTimeToCoalescingKey = new SparseIntArray();

  /**
   * Starts tracking a new coalescing key corresponding to the gesture with this down time.
   */
  public void addCoalescingKey(long downTime) {
    mDownTimeToCoalescingKey.put((int) downTime, 0);
  }

  /**
   * Increments the coalescing key corresponding to the gesture with this down time.
   */
  public void incrementCoalescingKey(long downTime) {
    int currentValue = mDownTimeToCoalescingKey.get((int) downTime, -1);
    if (currentValue == -1) {
      throw new RuntimeException("Tried to increment non-existent cookie");
    }
    mDownTimeToCoalescingKey.put((int) downTime, currentValue + 1);
  }

  /**
   * Gets the coalescing key corresponding to the gesture with this down time.
   */
  public short getCoalescingKey(long downTime) {
    int currentValue = mDownTimeToCoalescingKey.get((int) downTime, -1);
    if (currentValue == -1) {
      throw new RuntimeException("Tried to get non-existent cookie");
    }
    return ((short) (0xffff & currentValue));
  }

  /**
   * Stops tracking a new coalescing key corresponding to the gesture with this down time.
   */
  public void removeCoalescingKey(long downTime) {
    mDownTimeToCoalescingKey.delete((int) downTime);
  }

  public boolean hasCoalescingKey(long downTime) {
    int currentValue = mDownTimeToCoalescingKey.get((int) downTime, -1);
    if (currentValue == -1) {
      return false;
    }
    return true;
  }
}
