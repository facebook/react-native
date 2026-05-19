/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import android.util.SparseIntArray

/**
 * Utility for determining coalescing keys for TouchEvents. To preserve proper ordering of events,
 * move events should only be coalesced if there has been no up/down event between them (this
 * basically only applies to multitouch since for single touches an up would signal the end of the
 * gesture). To illustrate to kind of coalescing we want, imagine we are coalescing the following
 * touch stream:
 *
 * (U = finger up, D = finger down, M = move) D MMMMM D MMMMMMMMMMMMMM U MMMMM D MMMMMM U U
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
 * We identify a single gesture based on [android.view.MotionEvent.getDownTime] which will stay
 * constant for a given set of related touches on a single view.
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
  private val downTimeToCoalescingKey = SparseIntArray()

  /** Starts tracking a new coalescing key corresponding to the gesture with this down time. */
  public fun addCoalescingKey(downTime: Long) {
    downTimeToCoalescingKey.put(downTime.toInt(), 0)
  }

  /** Increments the coalescing key corresponding to the gesture with this down time. */
  public fun incrementCoalescingKey(downTime: Long) {
    val currentValue = downTimeToCoalescingKey[downTime.toInt(), -1]
    if (currentValue == -1) {
      throw RuntimeException("Tried to increment non-existent cookie")
    }
    downTimeToCoalescingKey.put(downTime.toInt(), currentValue + 1)
  }

  /** Gets the coalescing key corresponding to the gesture with this down time. */
  public fun getCoalescingKey(downTime: Long): Short {
    val currentValue = downTimeToCoalescingKey[downTime.toInt(), -1]
    if (currentValue == -1) {
      throw RuntimeException("Tried to get non-existent cookie")
    }
    return ((0xffff and currentValue).toShort())
  }

  /** Stops tracking a new coalescing key corresponding to the gesture with this down time. */
  public fun removeCoalescingKey(downTime: Long) {
    downTimeToCoalescingKey.delete(downTime.toInt())
  }

  public fun hasCoalescingKey(downTime: Long): Boolean =
      downTimeToCoalescingKey[downTime.toInt(), -1] != -1
}
