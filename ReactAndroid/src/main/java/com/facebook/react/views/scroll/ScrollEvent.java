/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.scroll;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * A event dispatched from a ScrollView scrolling.
 */
public class ScrollEvent extends Event<ScrollEvent> {

  public static final String EVENT_NAME = "topScroll";

  private final int mScrollX;
  private final int mScrollY;
  private final int mContentWidth;
  private final int mContentHeight;
  private final int mScrollViewWidth;
  private final int mScrollViewHeight;

  public ScrollEvent(
      int viewTag,
      long timestampMs,
      int scrollX,
      int scrollY,
      int contentWidth,
      int contentHeight,
      int scrollViewWidth,
      int scrollViewHeight) {
    super(viewTag, timestampMs);
    mScrollX = scrollX;
    mScrollY = scrollY;
    mContentWidth = contentWidth;
    mContentHeight = contentHeight;
    mScrollViewWidth = scrollViewWidth;
    mScrollViewHeight = scrollViewHeight;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public short getCoalescingKey() {
    // All scroll events for a given view can be coalesced
    return 0;
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

    WritableMap event = Arguments.createMap();
    event.putMap("contentInset", contentInset);
    event.putMap("contentOffset", contentOffset);
    event.putMap("contentSize", contentSize);
    event.putMap("layoutMeasurement", layoutMeasurement);

    event.putInt("target", getViewTag());
    event.putBoolean("responderIgnoreScroll", true);
    return event;
  }
}
