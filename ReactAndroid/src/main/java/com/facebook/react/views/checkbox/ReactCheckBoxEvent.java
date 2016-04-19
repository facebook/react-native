/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.checkbox;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by a ReactCheckBoxManager once a checkbox is checked/unchecked.
 */
/*package*/ class ReactCheckBoxEvent extends Event<ReactCheckBoxEvent> {

  public static final String EVENT_NAME = "topChange";
  private final boolean mIsChecked;

  protected ReactCheckBoxEvent(int viewTag, long timestampMs, boolean isChecked) {
    super(viewTag, timestampMs);
    mIsChecked = isChecked;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  public boolean isChecked() {
    return mIsChecked;
  }

  @Override
  public short getCoalescingKey() {
    // All checkbox events for a given view can be coalesced.
    return 0;
  }

  private WritableMap serializeEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("target", getViewTag());
    eventData.putBoolean("value", isChecked());
    return eventData;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }
}
