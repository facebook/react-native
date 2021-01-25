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

/** Event emitted by EditText native view when the text selection changes. */
/* package */ class ReactTextInputSelectionEvent extends Event<ReactTextInputSelectionEvent> {

  private static final String EVENT_NAME = "topSelectionChange";

  private int mSelectionStart;
  private int mSelectionEnd;

  @Deprecated
  public ReactTextInputSelectionEvent(int viewId, int selectionStart, int selectionEnd) {
    this(-1, viewId, selectionStart, selectionEnd);
  }

  public ReactTextInputSelectionEvent(
      int surfaceId, int viewId, int selectionStart, int selectionEnd) {
    super(surfaceId, viewId);
    mSelectionStart = selectionStart;
    mSelectionEnd = selectionEnd;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
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

    WritableMap selectionData = Arguments.createMap();
    selectionData.putInt("end", mSelectionEnd);
    selectionData.putInt("start", mSelectionStart);

    eventData.putMap("selection", selectionData);
    return eventData;
  }
}
