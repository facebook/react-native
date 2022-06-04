/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.drawer.events;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

public class DrawerClosedEvent extends Event<DrawerClosedEvent> {

  public static final String EVENT_NAME = "topDrawerClose";

  @Deprecated
  public DrawerClosedEvent(int viewId) {
    this(-1, viewId);
  }

  public DrawerClosedEvent(int surfaceId, int viewId) {
    super(surfaceId, viewId);
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  protected WritableMap getEventData() {
    return Arguments.createMap();
  }
}
