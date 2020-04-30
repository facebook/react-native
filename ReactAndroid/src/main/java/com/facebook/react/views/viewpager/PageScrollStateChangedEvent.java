/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.viewpager;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by {@link ReactViewPager} when user scrolling state changed.
 *
 * <p>Additional data provided by this event:
 *
 * <ul>
 *   <li>pageScrollState - {Idle,Dragging,Settling}
 * </ul>
 */
class PageScrollStateChangedEvent extends Event<PageScrollStateChangedEvent> {

  public static final String EVENT_NAME = "topPageScrollStateChanged";

  private final String mPageScrollState;

  protected PageScrollStateChangedEvent(int viewTag, String pageScrollState) {
    super(viewTag);
    mPageScrollState = pageScrollState;
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
    eventData.putString("pageScrollState", mPageScrollState);
    return eventData;
  }
}
