/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.switchview;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.events.Event;

/** Event emitted by a ReactSwitchManager once a switch is fully switched on/off */
/*package*/ class ReactSwitchEvent extends Event<ReactSwitchEvent> {

  public static final String EVENT_NAME = "topChange";

  private final boolean mIsChecked;

  @Deprecated
  public ReactSwitchEvent(int viewId, boolean isChecked) {
    this(ViewUtil.NO_SURFACE_ID, viewId, isChecked);
  }

  public ReactSwitchEvent(int surfaceId, int viewId, boolean isChecked) {
    super(surfaceId, viewId);
    mIsChecked = isChecked;
  }

  public boolean getIsChecked() {
    return mIsChecked;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Nullable
  @Override
  protected WritableMap getEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("target", getViewTag());
    eventData.putBoolean("value", getIsChecked());
    return eventData;
  }
}
