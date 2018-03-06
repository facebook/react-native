/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import javax.annotation.Nullable;

import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

public interface RCTEventEmitter extends JavaScriptModule {
  public void receiveEvent(int targetTag, String eventName, @Nullable WritableMap event);
  public void receiveTouches(
      String eventName,
      WritableArray touches,
      WritableArray changedIndices);
}
