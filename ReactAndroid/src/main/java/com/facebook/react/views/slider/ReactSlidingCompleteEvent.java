/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.slider;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

/** Event emitted when the user finishes dragging the slider. */
public class ReactSlidingCompleteEvent extends Event<ReactSlidingCompleteEvent> {

  public static final String EVENT_NAME = "topSlidingComplete";

  private final double mValue;

  @Deprecated
  public ReactSlidingCompleteEvent(int viewId, double value) {
    this(-1, viewId, value);
  }

  public ReactSlidingCompleteEvent(int surfaceId, int viewId, double value) {
    super(surfaceId, viewId);
    mValue = value;
  }

  public double getValue() {
    return mValue;
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
    eventData.putDouble("value", getValue());
    return eventData;
  }

  @Override
  public short getCoalescingKey() {
    return 0;
  }

  @Override
  public boolean canCoalesce() {
    return false;
  }
}
