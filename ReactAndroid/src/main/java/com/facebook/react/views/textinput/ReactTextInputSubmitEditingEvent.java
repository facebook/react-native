/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.react.uimanager.events.RCTModernEventEmitter;

/** Event emitted by EditText native view when the user submits the text. */
/* package */ class ReactTextInputSubmitEditingEvent
    extends Event<ReactTextInputSubmitEditingEvent> {

  private static final String EVENT_NAME = "topSubmitEditing";

  private String mText;

  @Deprecated
  public ReactTextInputSubmitEditingEvent(int viewId, String text) {
    this(-1, viewId, text);
  }

  public ReactTextInputSubmitEditingEvent(int surfaceId, int viewId, String text) {
    super(surfaceId, viewId);
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

  @Override
  public void dispatchModern(RCTModernEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(
        getSurfaceId(), getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("target", getViewTag());
    eventData.putString("text", mText);
    return eventData;
  }
}
