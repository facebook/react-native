/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.popupmenu;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/** Event emitted by a ReactSliderManager when user changes slider position. */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class PopupMenuSelectionEvent extends Event<PopupMenuSelectionEvent> {

  public static final String EVENT_NAME = "topSelectionChange";

  private final int mItem;

  public PopupMenuSelectionEvent(int surfaceId, int viewId, int item) {
    super(surfaceId, viewId);
    mItem = item;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  public int getItem() {
    return mItem;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("target", getViewTag());
    eventData.putDouble("item", getItem());
    return eventData;
  }
}
