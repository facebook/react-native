/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.interop;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * A reimplementation of {@link RCTEventEmitter} which is using a {@link EventDispatcher} under the
 * hood.
 *
 * <p>On Fabric, you're supposed to use {@link EventDispatcher} to dispatch events. However, we
 * provide an interop layer for non-Fabric migrated components.
 *
 * <p>This instance will be returned if the user is invoking `context.getJsModule(RCTEventEmitter)
 * and is providing support for the `receiveEvent` method, so that non-Fabric ViewManagers can
 * continue to deliver events also when Fabric is turned on.
 */
public class InteropEventEmitter implements RCTEventEmitter {

  private final ReactContext mReactContext;

  private @Nullable EventDispatcher mEventDispatcherOverride;

  public InteropEventEmitter(ReactContext reactContext) {
    mReactContext = reactContext;
  }

  @Override
  public void receiveEvent(int targetReactTag, String eventName, @Nullable WritableMap eventData) {
    EventDispatcher dispatcher;
    if (mEventDispatcherOverride != null) {
      dispatcher = mEventDispatcherOverride;
    } else {
      dispatcher = UIManagerHelper.getEventDispatcherForReactTag(mReactContext, targetReactTag);
    }
    int surfaceId = UIManagerHelper.getSurfaceId(mReactContext);
    if (dispatcher != null) {
      dispatcher.dispatchEvent(new InteropEvent(eventName, eventData, surfaceId, targetReactTag));
    }
  }

  @Override
  public void receiveTouches(
      String eventName, WritableArray touches, WritableArray changedIndices) {
    throw new UnsupportedOperationException(
        "EventEmitter#receiveTouches is not supported by the Fabric Interop Layer");
  }

  @VisibleForTesting
  void overrideEventDispatcher(EventDispatcher eventDispatcherOverride) {
    mEventDispatcherOverride = eventDispatcherOverride;
  }
}
