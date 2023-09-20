/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
import com.facebook.react.bridge.ReactSoftExceptionLogger;
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
  public void receiveEvent(
      int surfaceId, int targetTag, String eventName, @Nullable WritableMap event) {
    // We assume this event can't be coalesced. `customCoalesceKey` has no meaning in Fabric.
    receiveEvent(surfaceId, targetTag, eventName, false, 0, event, EventCategoryDef.UNSPECIFIED);
  }

  @Override
  public void receiveTouches(
      String eventName, WritableArray touches, WritableArray changedIndices) {
    /*
     * This method should be unused by default processing pipeline, but leaving it here to make sure
     * that any custom code using it in legacy renderer is compatible
     */
    Assertions.assertCondition(touches.size() > 0);

    int reactTag = touches.getMap(0).getInt(TARGET_KEY);
    @UIManagerType int uiManagerType = ViewUtil.getUIManagerType(reactTag);
    if (uiManagerType == UIManagerType.DEFAULT && getDefaultEventEmitter() != null) {
      mRCTEventEmitter.receiveTouches(eventName, touches, changedIndices);
    }
  }

  @Override
  public void receiveTouches(TouchEvent event) {
    int reactTag = event.getViewTag();
    @UIManagerType
    int uiManagerType = ViewUtil.getUIManagerType(event.getViewTag(), event.getSurfaceId());
    if (uiManagerType == UIManagerType.FABRIC && mFabricEventEmitter != null) {
      mFabricEventEmitter.receiveTouches(event);
    } else if (uiManagerType == UIManagerType.DEFAULT && getDefaultEventEmitter() != null) {
      TouchesHelper.sendTouchesLegacy(mRCTEventEmitter, event);
    } else {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new ReactNoCrashSoftException(
              "Cannot find EventEmitter for receivedTouches: ReactTag["
                  + reactTag
                  + "] UIManagerType["
                  + uiManagerType
                  + "] EventName["
                  + event.getEventName()
                  + "]"));
    }
  }

  /**
   * Get default/Paper event emitter. Callers should have verified that this is not an event for a
   * View managed by Fabric
   */
  @Nullable
  private RCTEventEmitter getDefaultEventEmitter() {
    if (mRCTEventEmitter == null) {
      if (mReactContext.hasActiveReactInstance()) {
        mRCTEventEmitter = mReactContext.getJSModule(RCTEventEmitter.class);
      } else {
        ReactSoftExceptionLogger.logSoftException(
            TAG,
            new ReactNoCrashSoftException(
                "Cannot get RCTEventEmitter from Context, no active Catalyst instance!"));
      }
    }
    return mRCTEventEmitter;
  }

  @Override
  public void receiveEvent(
      int surfaceId,
      int targetReactTag,
      String eventName,
      boolean canCoalesceEvent,
      int customCoalesceKey,
      @Nullable WritableMap event,
      @EventCategoryDef int category) {
    @UIManagerType int uiManagerType = ViewUtil.getUIManagerType(targetReactTag, surfaceId);
    if (uiManagerType == UIManagerType.FABRIC && mFabricEventEmitter != null) {
      mFabricEventEmitter.receiveEvent(
          surfaceId,
          targetReactTag,
          eventName,
          canCoalesceEvent,
          customCoalesceKey,
          event,
          category);
    } else if (uiManagerType == UIManagerType.DEFAULT && getDefaultEventEmitter() != null) {
      mRCTEventEmitter.receiveEvent(targetReactTag, eventName, event);
    } else {
      ReactSoftExceptionLogger.logSoftException(
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
