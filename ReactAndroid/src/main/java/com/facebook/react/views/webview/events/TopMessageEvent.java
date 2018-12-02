/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.webview.events;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted when there is an error in loading.
 */
public class TopMessageEvent extends Event<TopMessageEvent> {

  public static final String EVENT_NAME = "topMessage";
  private final String mData;

  public TopMessageEvent(int viewId, String data) {
    super(viewId);
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

  @Override
  public short getCoalescingKey() {
    // All events for a given view can be coalesced.
    return 0;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    WritableMap data = Arguments.createMap();
    data.putString("data", mData);
    rctEventEmitter.receiveEvent(getViewTag(), EVENT_NAME, data);
  }
}
