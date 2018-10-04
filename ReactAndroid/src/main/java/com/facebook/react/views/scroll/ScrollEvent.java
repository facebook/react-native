/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import javax.annotation.Nullable;

import java.lang.Override;

import android.support.v4.util.Pools;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * A event dispatched from a ScrollView scrolling.
 */
public class ScrollEvent extends Event<ScrollEvent> {

  private static final Pools.SynchronizedPool<ScrollEvent> EVENTS_POOL =
      new Pools.SynchronizedPool<>(3);

  private int mScrollX;
  private int mScrollY;
  private double mXVelocity;
  private double mYVelocity;
  private int mContentWidth;
  private int mContentHeight;
  private int mScrollViewWidth;
  private int mScrollViewHeight;
  private @Nullable ScrollEventType mScrollEventType;

  public static ScrollEvent obtain(
      int viewTag,
      ScrollEventType scrollEventType,
      int scrollX,
      int scrollY,
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
    EVENTS_POOL.release(this);
  }

  private ScrollEvent() {
  }

  private void init(
      int viewTag,
      ScrollEventType scrollEventType,
      int scrollX,
      int scrollY,
      float xVelocity,
      float yVelocity,
      int contentWidth,
      int contentHeight,
      int scrollViewWidth,
      int scrollViewHeight) {
    super.init(viewTag);
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
  public short getCoalescingKey() {
    // All scroll events for a given view can be coalesced
    return 0;
  }

  @Override
  public boolean canCoalesce() {
    // Only SCROLL events can be coalesced, all others can not be
    if (mScrollEventType == ScrollEventType.SCROLL) {
      return true;
    }
    return false;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
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
