/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import java.util.List;

/** Handles updating a {@link ValueAnimatedNode} when an event gets dispatched. */
/* package */ class EventAnimationDriver implements RCTEventEmitter {
  private List<String> mEventPath;
  /* package */ ValueAnimatedNode mValueNode;

  public EventAnimationDriver(List<String> eventPath, ValueAnimatedNode valueNode) {
    mEventPath = eventPath;
    mValueNode = valueNode;
  }

  @Override
  public void receiveEvent(int targetTag, String eventName, @Nullable WritableMap event) {
    if (event == null) {
      throw new IllegalArgumentException("Native animated events must have event data.");
    }

    // Get the new value for the node by looking into the event map using the provided event path.
    ReadableMap curMap = event;
    for (int i = 0; i < mEventPath.size() - 1; i++) {
      curMap = curMap.getMap(mEventPath.get(i));
    }

    mValueNode.mValue = curMap.getDouble(mEventPath.get(mEventPath.size() - 1));
  }

  @Override
  public void receiveTouches(
      String eventName, WritableArray touches, WritableArray changedIndices) {
    throw new RuntimeException("receiveTouches is not support by native animated events");
  }
}
