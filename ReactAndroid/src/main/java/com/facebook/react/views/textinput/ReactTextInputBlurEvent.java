/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.react.uimanager.events.RCTModernEventEmitter;

/** Event emitted by EditText native view when it loses focus. */
/* package */ class ReactTextInputBlurEvent extends Event<ReactTextInputBlurEvent> {

  private static final String EVENT_NAME = "topBlur";

  @Deprecated
  public ReactTextInputBlurEvent(int viewId) {
    this(-1, viewId);
  }

  public ReactTextInputBlurEvent(int surfaceId, int viewId) {
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

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  @Override
  public void dispatchV2(RCTModernEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(
        getSurfaceId(), getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("target", getViewTag());
    return eventData;
  }
}
