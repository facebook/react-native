/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import static com.facebook.react.uimanager.events.TouchesHelper.TARGET_KEY;

import android.util.SparseArray;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftException;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.common.ViewUtil;

public class ReactEventEmitter implements RCTEventEmitter {

  private static final String TAG = "ReactEventEmitter";

  private final SparseArray<RCTEventEmitter> mEventEmitters = new SparseArray<>();

  private final ReactApplicationContext mReactContext;

  public ReactEventEmitter(ReactApplicationContext reactContext) {
    mReactContext = reactContext;
  }

  public void register(@UIManagerType int uiManagerType, RCTEventEmitter eventEmitter) {
    mEventEmitters.put(uiManagerType, eventEmitter);
  }

  public void unregister(@UIManagerType int uiManagerType) {
    mEventEmitters.remove(uiManagerType);
  }

  @Override
  public void receiveEvent(int targetReactTag, String eventName, @Nullable WritableMap event) {
    RCTEventEmitter eventEmitter = getEventEmitter(targetReactTag);
    if (eventEmitter != null) {
      eventEmitter.receiveEvent(targetReactTag, eventName, event);
    }
  }

  @Override
  public void receiveTouches(
      String eventName, WritableArray touches, WritableArray changedIndices) {

    Assertions.assertCondition(touches.size() > 0);

    int reactTag = touches.getMap(0).getInt(TARGET_KEY);
    RCTEventEmitter eventEmitter = getEventEmitter(reactTag);
    if (eventEmitter != null) {
      eventEmitter.receiveTouches(eventName, touches, changedIndices);
    }
  }

  @Nullable
  private RCTEventEmitter getEventEmitter(int reactTag) {
    int type = ViewUtil.getUIManagerType(reactTag);
    RCTEventEmitter eventEmitter = mEventEmitters.get(type);
    if (eventEmitter == null) {
      // TODO T54145494: Refactor RN Event Emitter system to make sure reactTags are always managed
      // by RN
      FLog.e(
          TAG, "Unable to find event emitter for reactTag: %d - uiManagerType: %d", reactTag, type);
      if (mReactContext.hasActiveCatalystInstance()) {
        eventEmitter = mReactContext.getJSModule(RCTEventEmitter.class);
      } else {
        ReactSoftException.logSoftException(
            TAG,
            new ReactNoCrashSoftException(
                "Cannot get RCTEventEmitter from Context for reactTag: "
                    + reactTag
                    + " - uiManagerType: "
                    + type
                    + " - No active Catalyst instance!"));
      }
    }
    return eventEmitter;
  }
}
