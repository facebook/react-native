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

/**
 * Event emitted by EditText native view when text changes. VisibleForTesting from {@link
 * TextInputEventsTestCase}.
 */
public class ReactTextChangedEvent extends Event<ReactTextChangedEvent> {

  public static final String EVENT_NAME = "topChange";

  private String mText;
  private int mEventCount;
  // See https://developer.android.com/reference/android/text/TextWatcher#onTextChanged(java.lang.CharSequence,%20int,%20int,%20int)
  private int mStart;
  private int mCount;
  private int mBefore;

  @Deprecated
  public ReactTextChangedEvent(int viewId, String text, int eventCount, int start, int count, int before) {
    this(ViewUtil.NO_SURFACE_ID, viewId, text, eventCount, start, count, before);
  }

  public ReactTextChangedEvent(int surfaceId, int viewId, String text, int eventCount, int start, int count, int before) {
    super(surfaceId, viewId);
    mText = text;
    mEventCount = eventCount;
    mStart = start;
    mCount = count;
    mBefore = before;
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
    eventData.putInt("start", mStart);
    eventData.putInt("count", mCount);
    eventData.putInt("before", mBefore);
    return eventData;
  }
}
