/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event used to notify JS component about changes of its position or dimensions
 */
/* package */ class OnLayoutEvent extends Event<OnLayoutEvent> {

  private final int mX, mY, mWidth, mHeight;

  protected OnLayoutEvent(int viewTag, int x, int y, int width, int height) {
    super(viewTag, 0);
    mX = x;
    mY = y;
    mWidth = width;
    mHeight = height;
  }

  @Override
  public String getEventName() {
    return "topLayout";
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    WritableMap layout = Arguments.createMap();
    layout.putDouble("x", PixelUtil.toDIPFromPixel(mX));
    layout.putDouble("y", PixelUtil.toDIPFromPixel(mY));
    layout.putDouble("width", PixelUtil.toDIPFromPixel(mWidth));
    layout.putDouble("height", PixelUtil.toDIPFromPixel(mHeight));

    WritableMap event = Arguments.createMap();
    event.putMap("layout", layout);
    event.putInt("target", getViewTag());

    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), event);
  }
}
