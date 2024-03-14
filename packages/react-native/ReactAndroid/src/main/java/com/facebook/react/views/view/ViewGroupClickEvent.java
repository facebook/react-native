/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.events.Event;

/** Represents a Click on the ReactViewGroup */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ViewGroupClickEvent extends Event<ViewGroupClickEvent> {
  private static final String EVENT_NAME = "topClick";

  @Deprecated
  public ViewGroupClickEvent(int viewId) {
    this(ViewUtil.NO_SURFACE_ID, viewId);
  }

  public ViewGroupClickEvent(int surfaceId, int viewId) {
    super(surfaceId, viewId);
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public boolean canCoalesce() {
    return false;
  }

  @Nullable
  @Override
  protected WritableMap getEventData() {
    return Arguments.createMap();
  }
}
