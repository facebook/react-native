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

/** Event emitted by EditText native view when key pressed */
public class ReactTextInputKeyPressEvent extends Event<ReactTextInputEvent> {

  public static final String EVENT_NAME = "topKeyPress";

  private String mKey;

  @Deprecated
  ReactTextInputKeyPressEvent(int viewId, final String key) {
    this(ViewUtil.NO_SURFACE_ID, viewId, key);
  }

  ReactTextInputKeyPressEvent(int surfaceId, int viewId, final String key) {
    super(surfaceId, viewId);
    mKey = key;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Nullable
  @Override
  protected WritableMap getEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putString("key", mKey);
    return eventData;
  }

  @Override
  public boolean canCoalesce() {
    // We don't want to miss any textinput event, as event data is incremental.
    return false;
  }
}
