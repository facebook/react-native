// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager.events;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;

/** Event dispatched when total width or height of a view's children changes */
public class ContentSizeChangeEvent extends Event<ContentSizeChangeEvent> {

  public static final String EVENT_NAME = "topContentSizeChange";

  private final int mWidth;
  private final int mHeight;

  public ContentSizeChangeEvent(int viewTag, int width, int height) {
    super(viewTag);
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
