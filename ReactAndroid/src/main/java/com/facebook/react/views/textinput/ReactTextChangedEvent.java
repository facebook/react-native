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

/**
 * Event emitted by EditText native view when text changes. VisibleForTesting from {@link
 * TextInputEventsTestCase}.
 */
public class ReactTextChangedEvent extends Event<ReactTextChangedEvent> {

  public static final String EVENT_NAME = "topChange";

  private String mText;
  private int mEventCount;

  @Deprecated
  public ReactTextChangedEvent(int viewId, String text, int eventCount) {
    this(-1, viewId, text, eventCount);
  }

  public ReactTextChangedEvent(int surfaceId, int viewId, String text, int eventCount) {
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
    eventData.putString("text", mText);
    eventData.putInt("eventCount", mEventCount);
    eventData.putInt("target", getViewTag());
    return eventData;
  }
}
