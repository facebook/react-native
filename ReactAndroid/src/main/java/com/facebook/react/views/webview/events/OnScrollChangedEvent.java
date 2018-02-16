/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.webview.events;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted when a WebView has been scrolled.
 */
public class OnScrollChangedEvent extends Event<OnScrollChangedEvent> {

  public static final String EVENT_NAME = "onScrollChanged";

  private final int mX;
  private final int mY;
  private final int mPrevX;
  private final int mPrevY;

  /**
    * @param viewId the ID of the view
    * @param x the current horizontal scroll origin
    * @param y the current vertical scroll origin
    * @param prevX the previous horizontal scroll origin
    * @param prevY the previous vertical scroll origin
    */
  public OnScrollChangedEvent(int viewId, int x, int y, int prevX, int prevY) {
    super(viewId);
    mX = x;
    mY = y;
    mPrevX = prevX;
    mPrevY = prevY;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    WritableMap data = Arguments.createMap();
    data.putInt("x", mX);
    data.putInt("y", mY);
    data.putInt("prevX", mPrevX);
    data.putInt("prevY", mPrevY);
    rctEventEmitter.receiveEvent(getViewTag(), EVENT_NAME, data);
  }
}
