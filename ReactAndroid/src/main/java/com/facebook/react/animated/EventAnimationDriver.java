/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.UnexpectedNativeTypeException;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import java.util.List;

/** Handles updating a {@link ValueAnimatedNode} when an event gets dispatched. */
/* package */ class EventAnimationDriver implements RCTEventEmitter {
  private List<String> mEventPath;
  /* package */ ValueAnimatedNode mValueNode;
  /* package */ String mEventName;
  /* package */ int mViewTag;

  public EventAnimationDriver(
      String eventName, int viewTag, List<String> eventPath, ValueAnimatedNode valueNode) {
    mEventName = eventName;
    mViewTag = viewTag;
    mEventPath = eventPath;
    mValueNode = valueNode;
  }

  @Override
  public void receiveEvent(int targetTag, String eventName, @Nullable WritableMap event) {
    if (event == null) {
      throw new IllegalArgumentException("Native animated events must have event data.");
    }

    // Get the new value for the node by looking into the event map using the provided event path.
    ReadableMap currMap = event;
    ReadableArray currArray = null;
    for (int i = 0; i < mEventPath.size() - 1; i++) {
      if (currMap != null) {
        String key = mEventPath.get(i);
        ReadableType keyType = currMap.getType(key);
        if (keyType == ReadableType.Map) {
          currMap = currMap.getMap(key);
          currArray = null;
        } else if (keyType == ReadableType.Array) {
          currArray = currMap.getArray(key);
          currMap = null;
        } else {
          throw new UnexpectedNativeTypeException(
              "Unexpected type " + keyType + " for key '" + key + "'");
        }
      } else {
        int index = Integer.parseInt(mEventPath.get(i));
        ReadableType keyType = currArray.getType(index);
        if (keyType == ReadableType.Map) {
          currMap = currArray.getMap(index);
          currArray = null;
        } else if (keyType == ReadableType.Array) {
          currArray = currArray.getArray(index);
          currMap = null;
        } else {
          throw new UnexpectedNativeTypeException(
              "Unexpected type " + keyType + " for index '" + index + "'");
        }
      }
    }

    String lastKey = mEventPath.get(mEventPath.size() - 1);
    if (currMap != null) {
      mValueNode.mValue = currMap.getDouble(lastKey);
    } else {
      int lastIndex = Integer.parseInt(lastKey);
      mValueNode.mValue = currArray.getDouble(lastIndex);
    }
  }

  @Override
  public void receiveTouches(
      String eventName, WritableArray touches, WritableArray changedIndices) {
    throw new RuntimeException("receiveTouches is not support by native animated events");
  }
}
