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

/** Event emitted by EditText native view when the text selection changes. */
/* package */ class ReactTextInputSelectionEvent extends Event<ReactTextInputSelectionEvent> {

  private static final String EVENT_NAME = "topSelectionChange";

  private int mSelectionStart;
  private int mSelectionEnd;
  private float mCursorPositionX;
  private float mCursorPositionY;

  @Deprecated
  public ReactTextInputSelectionEvent(
      int viewId,
      int selectionStart,
      int selectionEnd,
      float cursorPositionX,
      float cursorPositionY) {
    this(-1, viewId, selectionStart, selectionEnd, cursorPositionX, cursorPositionY);
  }

  public ReactTextInputSelectionEvent(
      int surfaceId,
      int viewId,
      int selectionStart,
      int selectionEnd,
      float cursorPositionX,
      float cursorPositionY) {
    super(surfaceId, viewId);
    mSelectionStart = selectionStart;
    mSelectionEnd = selectionEnd;
    mCursorPositionX = cursorPositionX;
    mCursorPositionY = cursorPositionY;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Nullable
  @Override
  protected WritableMap getEventData() {
    WritableMap eventData = Arguments.createMap();

    WritableMap selectionData = Arguments.createMap();
    selectionData.putInt("end", mSelectionEnd);
    selectionData.putInt("start", mSelectionStart);
    selectionData.putDouble("cursorPositionX", mCursorPositionX);
    selectionData.putDouble("cursorPositionY", mCursorPositionY);

    eventData.putMap("selection", selectionData);
    return eventData;
  }
}
