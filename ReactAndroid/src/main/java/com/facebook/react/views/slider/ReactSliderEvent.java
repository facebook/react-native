/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.slider;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/** Event emitted by a ReactSliderManager when user changes slider position. */
public class ReactSliderEvent extends Event<ReactSliderEvent> {

  public static final String EVENT_NAME = "topChange";

  private final double mValue;
  private final boolean mFromUser;

  public ReactSliderEvent(int viewId, double value, boolean fromUser) {
    super(viewId);
    mValue = value;
    mFromUser = fromUser;
  }

  public double getValue() {
    return mValue;
  }

  public boolean isFromUser() {
    return mFromUser;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("target", getViewTag());
    eventData.putDouble("value", getValue());
    eventData.putBoolean("fromUser", isFromUser());
    return eventData;
  }
}
