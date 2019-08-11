/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.views.drawer.events;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/** Event emitted by a DrawerLayout as it is being moved open/closed. */
public class DrawerSlideEvent extends Event<DrawerSlideEvent> {

  public static final String EVENT_NAME = "topDrawerSlide";

  private final float mOffset;

  public DrawerSlideEvent(int viewId, float offset) {
    super(viewId);
    mOffset = offset;
  }

  public float getOffset() {
    return mOffset;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public short getCoalescingKey() {
    // All slide events for a given view can be coalesced.
    return 0;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putDouble("offset", getOffset());
    return eventData;
  }
}
