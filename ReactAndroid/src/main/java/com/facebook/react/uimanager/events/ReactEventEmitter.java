/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import static com.facebook.react.uimanager.events.TouchesHelper.TARGET_KEY;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftException;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.common.ViewUtil;

public class ReactEventEmitter implements RCTModernEventEmitter {

  private static final String TAG = "ReactEventEmitter";

  @Nullable
  private RCTModernEventEmitter mFabricEventEmitter =
      null; /* Corresponds to a Fabric EventEmitter */

  @Nullable
  private RCTEventEmitter mRCTEventEmitter = null; /* Corresponds to a Non-Fabric EventEmitter */

  private final ReactApplicationContext mReactContext;

  public ReactEventEmitter(ReactApplicationContext reactContext) {
    mReactContext = reactContext;
  }

  public void register(@UIManagerType int uiManagerType, RCTModernEventEmitter eventEmitter) {
    assert uiManagerType == UIManagerType.FABRIC;
    mFabricEventEmitter = eventEmitter;
  }

  public void register(@UIManagerType int uiManagerType, RCTEventEmitter eventEmitter) {
    assert uiManagerType == UIManagerType.DEFAULT;
    mRCTEventEmitter = eventEmitter;
  }

  public void unregister(@UIManagerType int uiManagerType) {
    if (uiManagerType == UIManagerType.DEFAULT) {
      mRCTEventEmitter = null;
    } else {
      mFabricEventEmitter = null;
    }
  }

  @Override
  public void receiveEvent(int targetReactTag, String eventName, @Nullable WritableMap event) {
    receiveEvent(-1, targetReactTag, eventName, event);
  }

  @Override
  public void receiveTouches(
      String eventName, WritableArray touches, WritableArray changedIndices) {
    Assertions.assertCondition(touches.size() > 0);

    int reactTag = touches.getMap(0).getInt(TARGET_KEY);
    @UIManagerType int uiManagerType = ViewUtil.getUIManagerType(reactTag);
    if (uiManagerType == UIManagerType.FABRIC && mFabricEventEmitter != null) {
      mFabricEventEmitter.receiveTouches(eventName, touches, changedIndices);
    } else if (uiManagerType == UIManagerType.DEFAULT && getEventEmitter(reactTag) != null) {
      mRCTEventEmitter.receiveTouches(eventName, touches, changedIndices);
    } else {
      ReactSoftException.logSoftException(
          TAG,
          new ReactNoCrashSoftException(
              "Cannot find EventEmitter for receivedTouches: ReactTag["
                  + reactTag
                  + "] UIManagerType["
                  + uiManagerType
                  + "] EventName["
                  + eventName
                  + "]"));
    }
  }

  @Nullable
  private RCTEventEmitter getEventEmitter(int reactTag) {
    int type = ViewUtil.getUIManagerType(reactTag);
    assert type == UIManagerType.DEFAULT;
    if (mRCTEventEmitter == null) {
      if (mReactContext.hasActiveReactInstance()) {
        mRCTEventEmitter = mReactContext.getJSModule(RCTEventEmitter.class);
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
    return mRCTEventEmitter;
  }

  @Override
  public void receiveEvent(
      int surfaceId, int targetReactTag, String eventName, @Nullable WritableMap event) {
    @UIManagerType int uiManagerType = ViewUtil.getUIManagerType(targetReactTag);
    if (uiManagerType == UIManagerType.FABRIC && mFabricEventEmitter != null) {
      mFabricEventEmitter.receiveEvent(surfaceId, targetReactTag, eventName, event);
    } else if (uiManagerType == UIManagerType.DEFAULT && getEventEmitter(targetReactTag) != null) {
      mRCTEventEmitter.receiveEvent(targetReactTag, eventName, event);
    } else {
      ReactSoftException.logSoftException(
          TAG,
          new ReactNoCrashSoftException(
              "Cannot find EventEmitter for receiveEvent: SurfaceId["
                  + surfaceId
                  + "] ReactTag["
                  + targetReactTag
                  + "] UIManagerType["
                  + uiManagerType
                  + "] EventName["
                  + eventName
                  + "]"));
    }
  }
}
