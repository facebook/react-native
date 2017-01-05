/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
