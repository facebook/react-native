/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.events;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.uimanager.events.EventCategoryDef;
import com.facebook.react.uimanager.events.RCTModernEventEmitter;
import com.facebook.react.uimanager.events.TouchEvent;
import com.facebook.react.uimanager.events.TouchesHelper;
import com.facebook.systrace.Systrace;

public class FabricEventEmitter implements RCTModernEventEmitter {

  private static final String TAG = "FabricEventEmitter";

  @NonNull private final FabricUIManager mUIManager;

  public FabricEventEmitter(@NonNull FabricUIManager uiManager) {
    mUIManager = uiManager;
  }

  @Override
  public void receiveEvent(int reactTag, @NonNull String eventName, @Nullable WritableMap params) {
    receiveEvent(-1, reactTag, eventName, params);
  }

  @Override
  public void receiveEvent(
      int surfaceId, int reactTag, String eventName, @Nullable WritableMap params) {
    receiveEvent(surfaceId, reactTag, eventName, false, 0, params, EventCategoryDef.UNSPECIFIED);
  }

  @Override
  public void receiveEvent(
      int surfaceId,
      int reactTag,
      String eventName,
      boolean canCoalesceEvent,
      int customCoalesceKey,
      @Nullable WritableMap params,
      @EventCategoryDef int category) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "FabricEventEmitter.receiveEvent('" + eventName + "')");
    mUIManager.receiveEvent(
        surfaceId, reactTag, eventName, canCoalesceEvent, customCoalesceKey, params, category);
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  /** Touches are dispatched by {@link #receiveTouches(TouchEvent)} */
  @Override
  public void receiveTouches(
      @NonNull String eventName,
      @NonNull WritableArray touches,
      @NonNull WritableArray changedIndices) {
    throw new IllegalStateException("EventEmitter#receiveTouches is not supported by Fabric");
  }

  @Override
  public void receiveTouches(TouchEvent event) {
    TouchesHelper.sendTouchEvent(this, event);
  }
}
