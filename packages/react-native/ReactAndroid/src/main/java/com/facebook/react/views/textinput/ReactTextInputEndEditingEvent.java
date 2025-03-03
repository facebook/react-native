/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.events.Event;

/**
 * Event emitted by EditText native view when text editing ends, because of the user leaving the
 * text input.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
class ReactTextInputEndEditingEvent extends Event<ReactTextInputEndEditingEvent> {

  private static final String EVENT_NAME = "topEndEditing";

  private String mText;

  @Deprecated
  public ReactTextInputEndEditingEvent(int viewId, String text) {
    this(ViewUtil.NO_SURFACE_ID, viewId, text);
  }

  public ReactTextInputEndEditingEvent(int surfaceId, int viewId, String text) {
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

  @Nullable
  @Override
  protected WritableMap getEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("target", getViewTag());
    eventData.putString("text", mText);
    return eventData;
  }
}
