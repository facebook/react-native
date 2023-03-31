/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.drawer.events;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.events.Event;

/** Event emitted by a DrawerLayout as it is being moved open/closed. */
public class DrawerSlideEvent extends Event<DrawerSlideEvent> {

  public static final String EVENT_NAME = "topDrawerSlide";

  private final float mOffset;

  @Deprecated
  public DrawerSlideEvent(int viewId, float offset) {
    this(ViewUtil.NO_SURFACE_ID, viewId, offset);
  }

  public DrawerSlideEvent(int surfaceId, int viewId, float offset) {
    super(surfaceId, viewId);
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
  protected WritableMap getEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putDouble("offset", getOffset());
    return eventData;
  }
}
