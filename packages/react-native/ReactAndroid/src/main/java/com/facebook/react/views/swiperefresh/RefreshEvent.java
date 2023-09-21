/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.swiperefresh;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.events.Event;

public class RefreshEvent extends Event<RefreshEvent> {

  @Deprecated
  protected RefreshEvent(int viewTag) {
    this(ViewUtil.NO_SURFACE_ID, viewTag);
  }

  protected RefreshEvent(int surfaceId, int viewTag) {
    super(surfaceId, viewTag);
  }

  @Override
  public String getEventName() {
    return "topRefresh";
  }

  @Nullable
  @Override
  protected WritableMap getEventData() {
    return Arguments.createMap();
  }
}
