/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.views.viewpager;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by {@link ReactViewPager} when selected page changes.
 *
 * <p>Additional data provided by this event:
 *
 * <ul>
 *   <li>position - index of page that has been selected
 * </ul>
 */
/* package */ class PageSelectedEvent extends Event<PageSelectedEvent> {

  public static final String EVENT_NAME = "topPageSelected";

  private final int mPosition;

  protected PageSelectedEvent(int viewTag, int position) {
    super(viewTag);
    mPosition = position;
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
    eventData.putInt("position", mPosition);
    return eventData;
  }
}
