/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image;

import androidx.annotation.IntDef;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

public class ImageLoadEvent extends Event<ImageLoadEvent> {
  @IntDef({ON_ERROR, ON_LOAD, ON_LOAD_END, ON_LOAD_START, ON_PROGRESS})
  @Retention(RetentionPolicy.SOURCE)
  @interface ImageEventType {}

  public static final int ON_ERROR = 1;
  public static final int ON_LOAD = 2;
  public static final int ON_LOAD_END = 3;
  public static final int ON_LOAD_START = 4;
  public static final int ON_PROGRESS = 5;

  private final int mEventType;
  private final @Nullable String mErrorMessage;
  private final @Nullable String mSourceUri;
  private final int mWidth;
  private final int mHeight;
  private final int mLoaded;
  private final int mTotal;

  public static final ImageLoadEvent createLoadStartEvent(int viewId) {
    return new ImageLoadEvent(viewId, ON_LOAD_START);
  }

  /**
   * @param loaded Amount of the image that has been loaded. It should be number of bytes, but
   *     Fresco does not currently provides that information.
   * @param total Amount that `loaded` will be when the image is fully loaded.
   */
  public static final ImageLoadEvent createProgressEvent(
      int viewId, @Nullable String imageUri, int loaded, int total) {
    return new ImageLoadEvent(viewId, ON_PROGRESS, null, imageUri, 0, 0, loaded, total);
  }

  public static final ImageLoadEvent createLoadEvent(
      int viewId, @Nullable String imageUri, int width, int height) {
    return new ImageLoadEvent(viewId, ON_LOAD, null, imageUri, width, height, 0, 0);
  }

  public static final ImageLoadEvent createErrorEvent(int viewId, Throwable throwable) {
    return new ImageLoadEvent(viewId, ON_ERROR, throwable.getMessage(), null, 0, 0, 0, 0);
  }

  public static final ImageLoadEvent createLoadEndEvent(int viewId) {
    return new ImageLoadEvent(viewId, ON_LOAD_END);
  }

  private ImageLoadEvent(int viewId, @ImageEventType int eventType) {
    this(viewId, eventType, null, null, 0, 0, 0, 0);
  }

  private ImageLoadEvent(
      int viewId,
      @ImageEventType int eventType,
      @Nullable String errorMessage,
      @Nullable String sourceUri,
      int width,
      int height,
      int loaded,
      int total) {
    super(viewId);
    mEventType = eventType;
    mErrorMessage = errorMessage;
    mSourceUri = sourceUri;
    mWidth = width;
    mHeight = height;
    mLoaded = loaded;
    mTotal = total;
  }

  public static String eventNameForType(@ImageEventType int eventType) {
    switch (eventType) {
      case ON_ERROR:
        return "topError";
      case ON_LOAD:
        return "topLoad";
      case ON_LOAD_END:
        return "topLoadEnd";
      case ON_LOAD_START:
        return "topLoadStart";
      case ON_PROGRESS:
        return "topProgress";
      default:
        throw new IllegalStateException("Invalid image event: " + Integer.toString(eventType));
    }
  }

  @Override
  public String getEventName() {
    return ImageLoadEvent.eventNameForType(mEventType);
  }

  @Override
  public short getCoalescingKey() {
    // Intentionally casting mEventType because it is guaranteed to be small
    // enough to fit into short.
    return (short) mEventType;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    WritableMap eventData = null;

    switch (mEventType) {
      case ON_PROGRESS:
        eventData = Arguments.createMap();
        eventData.putInt("loaded", mLoaded);
        eventData.putInt("total", mTotal);
        break;
      case ON_LOAD:
        eventData = Arguments.createMap();
        eventData.putMap("source", createEventDataSource());
        break;
      case ON_ERROR:
        eventData = Arguments.createMap();
        eventData.putString("error", mErrorMessage);
        break;
    }

    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), eventData);
  }

  private WritableMap createEventDataSource() {
    WritableMap source = Arguments.createMap();
    source.putString("uri", mSourceUri);
    source.putDouble("width", mWidth);
    source.putDouble("height", mHeight);
    return source;
  }
}
