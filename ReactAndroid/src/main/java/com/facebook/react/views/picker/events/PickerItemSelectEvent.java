/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.picker.events;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

public class PickerItemSelectEvent extends Event<PickerItemSelectEvent> {
  public static final String EVENT_NAME = "topSelect";

  private final int mPosition;

  @Deprecated
  public PickerItemSelectEvent(int reactTag, int position) {
    this(-1, reactTag, position);
  }

  public PickerItemSelectEvent(int surfaceId, int reactTag, int position) {
    super(surfaceId, reactTag);
    mPosition = position;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Nullable
  @Override
  protected WritableMap getEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("position", mPosition);
    return eventData;
  }
}
