// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.recyclerview;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event dispatched by {@link RecyclerViewBackedScrollView} when total height of it's children
 * changes
 */
public class ContentSizeChangeEvent extends Event<ContentSizeChangeEvent> {

  public static final String EVENT_NAME = "topContentSizeChange";

  private final int mWidth;
  private final int mHeight;

  public ContentSizeChangeEvent(int viewTag, long timestampMs, int width, int height) {
    super(viewTag, timestampMs);
    mWidth = width;
    mHeight = height;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    WritableMap data = Arguments.createMap();
    data.putDouble("width", PixelUtil.toDIPFromPixel(mWidth));
    data.putDouble("height", PixelUtil.toDIPFromPixel(mHeight));
    rctEventEmitter.receiveEvent(getViewTag(), EVENT_NAME, data);
  }
}
