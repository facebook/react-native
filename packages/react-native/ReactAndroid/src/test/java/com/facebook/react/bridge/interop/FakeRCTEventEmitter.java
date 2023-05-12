/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.interop;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class FakeRCTEventEmitter implements RCTEventEmitter {

  @Override
  public void receiveEvent(int targetReactTag, String eventName, @Nullable WritableMap event) {}

  @Override
  public void receiveTouches(
      String eventName, WritableArray touches, WritableArray changedIndices) {}
}
