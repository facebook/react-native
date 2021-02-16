/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

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

  @Nullable
  @Override
  protected WritableMap getEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("target", getViewTag());
    eventData.putString("text", mText);
    return eventData;
  }

  @Override
  public boolean canCoalesce() {
    return false;
  }
}
