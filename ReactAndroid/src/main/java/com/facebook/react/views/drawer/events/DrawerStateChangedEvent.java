/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.drawer.events;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

public class DrawerStateChangedEvent extends Event<DrawerStateChangedEvent> {

  public static final String EVENT_NAME = "topDrawerStateChanged";

  private final int mDrawerState;

  @Deprecated
  public DrawerStateChangedEvent(int viewId, int drawerState) {
    this(-1, viewId, drawerState);
  }

  public DrawerStateChangedEvent(int surfaceId, int viewId, int drawerState) {
    super(surfaceId, viewId);
    mDrawerState = drawerState;
  }

  public int getDrawerState() {
    return mDrawerState;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  protected WritableMap getEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putDouble("drawerState", getDrawerState());
    return eventData;
  }
}
