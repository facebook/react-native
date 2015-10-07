/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.textinput;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by EditText native view when text changes.
 */
/* package */ class ReactTextInputEvent extends Event<ReactTextInputEvent> {

  public static final String EVENT_NAME = "topTextInput";

  private String mText;
  private String mPreviousText;
  private int mRangeStart;
  private int mRangeEnd;

  public ReactTextInputEvent(
      int viewId,
      long timestampMs,
      String text,
      String previousText,
      int rangeStart,
      int rangeEnd) {
    super(viewId, timestampMs);
    mText = text;
    mPreviousText = previousText;
    mRangeStart = rangeStart;
    mRangeEnd = rangeEnd;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public boolean canCoalesce() {
    // We don't want to miss any textinput event, as event data is incremental.
    return false;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    WritableMap eventData = Arguments.createMap();
    WritableMap range = Arguments.createMap();
    range.putDouble("start", mRangeStart);
    range.putDouble("end", mRangeEnd);

    eventData.putString("text", mText);
    eventData.putString("previousText", mPreviousText);
    eventData.putMap("range", range);

    eventData.putInt("target", getViewTag());
    return eventData;
  }
}
