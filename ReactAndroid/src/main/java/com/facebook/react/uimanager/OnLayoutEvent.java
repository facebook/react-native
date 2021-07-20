/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import androidx.annotation.Nullable;
import androidx.core.util.Pools;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

/** Event used to notify JS component about changes of its position or dimensions */
public class OnLayoutEvent extends Event<OnLayoutEvent> {

  private static final Pools.SynchronizedPool<OnLayoutEvent> EVENTS_POOL =
      new Pools.SynchronizedPool<>(20);

  private int mX, mY, mWidth, mHeight;

  @Deprecated
  public static OnLayoutEvent obtain(int viewTag, int x, int y, int width, int height) {
    return obtain(-1, viewTag, x, y, width, height);
  }

  public static OnLayoutEvent obtain(
      int surfaceId, int viewTag, int x, int y, int width, int height) {
    OnLayoutEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new OnLayoutEvent();
    }
    event.init(surfaceId, viewTag, x, y, width, height);
    return event;
  }

  @Override
  public void onDispose() {
    EVENTS_POOL.release(this);
  }

  private OnLayoutEvent() {}

  @Deprecated
  protected void init(int viewTag, int x, int y, int width, int height) {
    init(-1, viewTag, x, y, width, height);
  }

  protected void init(int surfaceId, int viewTag, int x, int y, int width, int height) {
    super.init(surfaceId, viewTag);
    mX = x;
    mY = y;
    mWidth = width;
    mHeight = height;
  }

  @Override
  public String getEventName() {
    return "topLayout";
  }

  @Nullable
  @Override
  protected WritableMap getEventData() {
    WritableMap layout = Arguments.createMap();
    layout.putDouble("x", PixelUtil.toDIPFromPixel(mX));
    layout.putDouble("y", PixelUtil.toDIPFromPixel(mY));
    layout.putDouble("width", PixelUtil.toDIPFromPixel(mWidth));
    layout.putDouble("height", PixelUtil.toDIPFromPixel(mHeight));

    WritableMap event = Arguments.createMap();
    event.putMap("layout", layout);
    event.putInt("target", getViewTag());
    return event;
  }
}
