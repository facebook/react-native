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
public class ReactTextInputEvent extends Event<ReactTextInputEvent> {

  public static final String EVENT_NAME = "topTextInput";

  private String mText;
  private String mPreviousText;
  private int mRangeStart;
  private int mRangeEnd;

  @Deprecated
  public ReactTextInputEvent(
      int viewId, String text, String previousText, int rangeStart, int rangeEnd) {
    this(ViewUtil.NO_SURFACE_ID, viewId, text, previousText, rangeStart, rangeEnd);
  }

  public ReactTextInputEvent(
      int surfaceId, int viewId, String text, String previousText, int rangeStart, int rangeEnd) {
    super(surfaceId, viewId);
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

  @Nullable
  @Override
  protected WritableMap getEventData() {
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
