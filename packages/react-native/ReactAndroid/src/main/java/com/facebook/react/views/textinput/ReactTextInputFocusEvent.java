/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.events.Event;

/** Event emitted by EditText native view when it receives focus. */
/* package */ class ReactTextInputFocusEvent extends Event<ReactTextInputFocusEvent> {

  private static final String EVENT_NAME = "topFocus";

  private String mText;
  private int mEventCount;

  @Deprecated
  public ReactTextInputFocusEvent(int viewId, String text, int eventCount) {
    this(ViewUtil.NO_SURFACE_ID, viewId, text, eventCount);
  }

  public ReactTextInputFocusEvent(int surfaceId, int viewId, String text, int eventCount) {
    super(surfaceId, viewId);
    mText = text;
    mEventCount = eventCount;
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
    eventData.putInt("eventCount", mEventCount);
    return eventData;
  }

  @Override
  public boolean canCoalesce() {
    return false;
  }
}
