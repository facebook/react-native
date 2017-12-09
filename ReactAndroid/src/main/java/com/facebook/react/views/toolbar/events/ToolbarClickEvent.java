/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
package com.facebook.react.views.toolbar.events;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Represents a click on the toolbar.
 * Position is meaningful when the click happened on a menu
 */
public class ToolbarClickEvent extends Event<ToolbarClickEvent> {

  private static final String EVENT_NAME = "topSelect";
  private final int position;

  public ToolbarClickEvent(int viewId, int position) {
    super(viewId);
    this.position = position;
  }

  public int getPosition() {
    return position;
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
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    WritableMap event = new WritableNativeMap();
    event.putInt("position", getPosition());
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), event);
  }

}
