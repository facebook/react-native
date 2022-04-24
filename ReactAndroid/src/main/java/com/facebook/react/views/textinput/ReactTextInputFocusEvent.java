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
import com.facebook.react.uimanager.events.Event;

/** Event emitted by EditText native view when it receives focus. */
/* package */ class ReactTextInputFocusEvent extends Event<ReactTextInputFocusEvent> {

  private static final String EVENT_NAME = "topFocus";

  @Deprecated
  public ReactTextInputFocusEvent(int viewId) {
    this(-1, viewId);
  }

  public ReactTextInputFocusEvent(int surfaceId, int viewId) {
    super(surfaceId, viewId);
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
    return eventData;
  }

  @Override
  public boolean canCoalesce() {
    return false;
  }
}
