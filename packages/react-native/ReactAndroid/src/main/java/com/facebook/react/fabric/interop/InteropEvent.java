/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.interop;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.uimanager.events.Event;

/**
 * An {@link Event} class used by the {@link InteropEventEmitter}. This class is just holding the
 * event name and the data which is received by the `receiveEvent` method and will be passed over
 * the the {@link com.facebook.react.uimanager.events.EventDispatcher}
 */
class InteropEvent extends Event<InteropEvent> {

  private final String mName;
  private final WritableMap mEventData;

  InteropEvent(String name, @Nullable WritableMap eventData, int surfaceId, int viewTag) {
    super(surfaceId, viewTag);
    mName = name;
    mEventData = eventData;
  }

  @Override
  public String getEventName() {
    return mName;
  }

  @Override
  @VisibleForTesting
  public WritableMap getEventData() {
    return mEventData;
  }
}
