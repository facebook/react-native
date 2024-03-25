/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.events.Event;

/** Event emitted by EditText native view when content size changes. */
public class ReactContentSizeChangedEvent extends Event<ReactTextChangedEvent> {

  public static final String EVENT_NAME = "topContentSizeChange";

  private float mContentWidth;
  private float mContentHeight;

  @Deprecated
  public ReactContentSizeChangedEvent(int viewId, float contentSizeWidth, float contentSizeHeight) {
    this(ViewUtil.NO_SURFACE_ID, viewId, contentSizeWidth, contentSizeHeight);
  }

  public ReactContentSizeChangedEvent(
      int surfaceId, int viewId, float contentSizeWidth, float contentSizeHeight) {
    super(surfaceId, viewId);
    mContentWidth = contentSizeWidth;
    mContentHeight = contentSizeHeight;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Nullable
  @Override
  protected WritableMap getEventData() {
    WritableMap eventData = Arguments.createMap();

    WritableMap contentSize = Arguments.createMap();
    contentSize.putDouble("width", mContentWidth);
    contentSize.putDouble("height", mContentHeight);
    eventData.putMap("contentSize", contentSize);

    eventData.putInt("target", getViewTag());
    return eventData;
  }
}
