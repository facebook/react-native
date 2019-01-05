/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by EditText native view when pasting in the view.
 * VisibleForTesting from {@link TextInputEventsTestCase}.
 */
public class ReactTextInputPasteEvent extends Event<ReactTextInputPasteEvent> {

  public static final String EVENT_NAME = "onPaste";

  private String mContent;
  private String mMimeType;

  public ReactTextInputPasteEvent(
      int viewId,
      String content,
      String mimeType) {
    super(viewId);
    mContent = content;
    mMimeType = mimeType;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putString("content", mContent);
    eventData.putString("mimeType", mMimeType);
    eventData.putInt("target", getViewTag());
    return eventData;
  }
}
