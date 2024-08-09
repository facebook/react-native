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
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.events.Event;

/**
 * Event emitted by EditText native view when clipboard content is pasted
 */
class ReactTextInputPasteEvent extends Event<ReactTextInputPasteEvent> {

  private static final String EVENT_NAME = "topPaste";

  private String mType;
  private String mData;

  @Deprecated
  public ReactTextInputPasteEvent(int viewId, String type, String data) {
    this(ViewUtil.NO_SURFACE_ID, viewId, type, data);
  }

  public ReactTextInputPasteEvent(int surfaceId, int viewId, String type, String data) {
    super(surfaceId, viewId);
    mType = type;
    mData = data;
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

    WritableArray items = Arguments.createArray();
    WritableMap item = Arguments.createMap();
    item.putString("type", mType);
    item.putString("data", mData);
    items.pushMap(item);

    eventData.putArray("items", items);

    return eventData;
  }
}
