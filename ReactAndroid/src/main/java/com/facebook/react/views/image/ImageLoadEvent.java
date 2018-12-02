/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image;

import android.support.annotation.IntDef;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import javax.annotation.Nullable;

public class ImageLoadEvent extends Event<ImageLoadEvent> {
  @IntDef({ON_ERROR, ON_LOAD, ON_LOAD_END, ON_LOAD_START, ON_PROGRESS})
  @Retention(RetentionPolicy.SOURCE)
  @interface ImageEventType {}

  // Currently ON_PROGRESS is not implemented, these can be added
  // easily once support exists in fresco.
  public static final int ON_ERROR = 1;
  public static final int ON_LOAD = 2;
  public static final int ON_LOAD_END = 3;
  public static final int ON_LOAD_START = 4;
  public static final int ON_PROGRESS = 5;

  private final int mEventType;
  private final @Nullable String mImageUri;
  private final int mWidth;
  private final int mHeight;

  public ImageLoadEvent(int viewId, @ImageEventType int eventType) {
    this(viewId, eventType, null);
  }

  public ImageLoadEvent(int viewId, @ImageEventType int eventType, String imageUri) {
    this(viewId, eventType, imageUri, 0, 0);
  }

  public ImageLoadEvent(
    int viewId,
    @ImageEventType int eventType,
    @Nullable String imageUri,
    int width,
    int height) {
    super(viewId);
    mEventType = eventType;
    mImageUri = imageUri;
    mWidth = width;
    mHeight = height;
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

    if (mImageUri != null || mEventType == ON_LOAD) {
      eventData = Arguments.createMap();

      if (mImageUri != null) {
        eventData.putString("uri", mImageUri);
      }

      if (mEventType == ON_LOAD) {
        WritableMap source = Arguments.createMap();
        source.putDouble("width", mWidth);
        source.putDouble("height", mHeight);
        if (mImageUri != null) {
          source.putString("url", mImageUri);
        }
        eventData.putMap("source", source);
      }
    }

    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), eventData);
  }
}
