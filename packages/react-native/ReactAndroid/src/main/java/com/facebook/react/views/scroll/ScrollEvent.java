/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import androidx.annotation.Nullable;
import androidx.core.util.Pools;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.events.Event;

/** A event dispatched from a ScrollView scrolling. */
public class ScrollEvent extends Event<ScrollEvent> {
  private static String TAG = ScrollEvent.class.getSimpleName();

  private static final Pools.SynchronizedPool<ScrollEvent> EVENTS_POOL =
      new Pools.SynchronizedPool<>(3);

  private float mScrollX;
  private float mScrollY;
  private float mXVelocity;
  private float mYVelocity;
  private int mContentWidth;
  private int mContentHeight;
  private int mScrollViewWidth;
  private int mScrollViewHeight;
  private @Nullable ScrollEventType mScrollEventType;

  @Deprecated
  public static ScrollEvent obtain(
      int viewTag,
      ScrollEventType scrollEventType,
      float scrollX,
      float scrollY,
      float xVelocity,
      float yVelocity,
      int contentWidth,
      int contentHeight,
      int scrollViewWidth,
      int scrollViewHeight) {
    return obtain(
        ViewUtil.NO_SURFACE_ID,
        viewTag,
        scrollEventType,
        scrollX,
        scrollY,
        xVelocity,
        yVelocity,
        contentWidth,
        contentHeight,
        scrollViewWidth,
        scrollViewHeight);
  }

  public static ScrollEvent obtain(
      int surfaceId,
      int viewTag,
      ScrollEventType scrollEventType,
      float scrollX,
      float scrollY,
      float xVelocity,
      float yVelocity,
      int contentWidth,
      int contentHeight,
      int scrollViewWidth,
      int scrollViewHeight) {
    ScrollEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new ScrollEvent();
    }
    event.init(
        surfaceId,
        viewTag,
        scrollEventType,
        scrollX,
        scrollY,
        xVelocity,
        yVelocity,
        contentWidth,
        contentHeight,
        scrollViewWidth,
        scrollViewHeight);
    return event;
  }

  @Override
  public void onDispose() {
    try {
      EVENTS_POOL.release(this);
    } catch (IllegalStateException e) {
      // This exception can be thrown when an event is double-released.
      // This is a problem but won't cause user-visible impact, so it's okay to fail silently.
      ReactSoftExceptionLogger.logSoftException(TAG, e);
    }
  }

  private ScrollEvent() {}

  private void init(
      int surfaceId,
      int viewTag,
      ScrollEventType scrollEventType,
      float scrollX,
      float scrollY,
      float xVelocity,
      float yVelocity,
      int contentWidth,
      int contentHeight,
      int scrollViewWidth,
      int scrollViewHeight) {
    super.init(surfaceId, viewTag);
    mScrollEventType = scrollEventType;
    mScrollX = scrollX;
    mScrollY = scrollY;
    mXVelocity = xVelocity;
    mYVelocity = yVelocity;
    mContentWidth = contentWidth;
    mContentHeight = contentHeight;
    mScrollViewWidth = scrollViewWidth;
    mScrollViewHeight = scrollViewHeight;
  }

  @Override
  public String getEventName() {
    return ScrollEventType.getJSEventName(Assertions.assertNotNull(mScrollEventType));
  }

  @Override
  public boolean canCoalesce() {
    // Only SCROLL events can be coalesced, all others can not be
    if (mScrollEventType == ScrollEventType.SCROLL) {
      return true;
    }
    return false;
  }

  @Nullable
  @Override
  protected WritableMap getEventData() {
    WritableMap contentInset = Arguments.createMap();
    contentInset.putDouble("top", 0);
    contentInset.putDouble("bottom", 0);
    contentInset.putDouble("left", 0);
    contentInset.putDouble("right", 0);

    WritableMap contentOffset = Arguments.createMap();
    contentOffset.putDouble("x", PixelUtil.toDIPFromPixel(mScrollX));
    contentOffset.putDouble("y", PixelUtil.toDIPFromPixel(mScrollY));

    WritableMap contentSize = Arguments.createMap();
    contentSize.putDouble("width", PixelUtil.toDIPFromPixel(mContentWidth));
    contentSize.putDouble("height", PixelUtil.toDIPFromPixel(mContentHeight));

    WritableMap layoutMeasurement = Arguments.createMap();
    layoutMeasurement.putDouble("width", PixelUtil.toDIPFromPixel(mScrollViewWidth));
    layoutMeasurement.putDouble("height", PixelUtil.toDIPFromPixel(mScrollViewHeight));

    WritableMap velocity = Arguments.createMap();
    velocity.putDouble("x", mXVelocity);
    velocity.putDouble("y", mYVelocity);

    WritableMap event = Arguments.createMap();
    event.putMap("contentInset", contentInset);
    event.putMap("contentOffset", contentOffset);
    event.putMap("contentSize", contentSize);
    event.putMap("layoutMeasurement", layoutMeasurement);
    event.putMap("velocity", velocity);

    event.putInt("target", getViewTag());
    event.putBoolean("responderIgnoreScroll", true);
    return event;
  }
}
