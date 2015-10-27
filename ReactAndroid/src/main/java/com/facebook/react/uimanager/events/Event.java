/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager.events;

/**
 * A UI event that can be dispatched to JS.
 */
public abstract class Event<T extends Event> {

  private final int mViewTag;
  private final long mTimestampMs;

  protected Event(int viewTag, long timestampMs) {
    mViewTag = viewTag;
    mTimestampMs = timestampMs;
  }

  /**
   * @return the view id for the view that generated this event
   */
  public final int getViewTag() {
    return mViewTag;
  }

  /**
   * @return the time at which the event happened in the {@link android.os.SystemClock#uptimeMillis}
   * base.
   */
  public final long getTimestampMs() {
    return mTimestampMs;
  }

  /**
   * @return false if this Event can *never* be coalesced
   */
  public boolean canCoalesce() {
    return true;
  }

  /**
   * Given two events, coalesce them into a single event that will be sent to JS instead of two
   * separate events. By default, just chooses the one the is more recent.
   *
   * Two events will only ever try to be coalesced if they have the same event name, view id, and
   * coalescing key.
   */
  public T coalesce(T otherEvent) {
    return (T) (getTimestampMs() > otherEvent.getTimestampMs() ? this : otherEvent);
  }

  /**
   * @return a key used to determine which other events of this type this event can be coalesced
   * with. For example, touch move events should only be coalesced within a single gesture so a
   * coalescing key there would be the unique gesture id.
   */
  public short getCoalescingKey() {
    return 0;
  }

  /**
   * Called when the EventDispatcher is done with an event, either because it was dispatched or
   * because it was coalesced with another Event.
   */
  public void dispose() {
  }

  /**
   * @return the name of this event as registered in JS
   */
  public abstract String getEventName();

  /**
   * Dispatch this event to JS using the given event emitter.
   */
  public abstract void dispatch(RCTEventEmitter rctEventEmitter);
}
