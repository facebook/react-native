/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import static com.facebook.react.uimanager.events.TouchesHelper.TARGET_KEY;

import android.util.Log;
import android.util.SparseArray;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.common.ViewUtil;
import java.io.Closeable;
import java.io.IOException;
import javax.annotation.Nullable;

public class ReactEventEmitter implements RCTEventEmitter {

  private static final String TAG = ReactEventEmitter.class.getSimpleName();
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
    getEventEmitter(targetReactTag).receiveEvent(targetReactTag, eventName, event);
  }

  @Override
  public void receiveTouches(
    String eventName,
    WritableArray touches,
    WritableArray changedIndices) {

    Assertions.assertCondition(touches.size() > 0);

    int reactTag = touches.getMap(0).getInt(TARGET_KEY);
    getEventEmitter(reactTag).receiveTouches(eventName, touches, changedIndices);
  }

  private RCTEventEmitter getEventEmitter(int reactTag) {
    int type = ViewUtil.getUIManagerType(reactTag);
    RCTEventEmitter eventEmitter = mEventEmitters.get(type);
    if (eventEmitter == null) {
      eventEmitter = mReactContext.getJSModule(RCTEventEmitter.class);
    }
    return eventEmitter;
  }
}
