/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.textinput;

import android.view.View;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by EditText native view when text editing ends,
 * because of the user leaving the text input.
 */
class ReactTextInputEndEditingEvent extends Event<ReactTextInputEndEditingEvent> {

  private static final String EVENT_NAME = "topEndEditing";

  private String mText;

  /**
   * See {@link Event#Event(int)}.
   *
   * @param viewTag
   * @param text
   */
  @Deprecated
  public ReactTextInputEndEditingEvent(
          int viewTag,
          String text) {
    super(viewTag);
    mText = text;
  }

  public ReactTextInputEndEditingEvent(
      View view,
      String text) {
    super(view);
    mText = text;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public boolean canCoalesce() {
    return false;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("target", getViewTag());
    eventData.putString("text", mText);
    return eventData;
  }
}
