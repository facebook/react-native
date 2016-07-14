/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.testing;

import javax.annotation.Nullable;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

/**
 * Dummy implementation of storage module, used for testing
 */
public final class FakeWebSocketModule extends BaseJavaModule {

  @Override
  public String getName() {
    return "WebSocketModule";
  }

  @Override
  public boolean canOverrideExistingModule() {
    return true;
  }

  @ReactMethod
  public void connect(
    final String url,
    @Nullable final ReadableArray protocols,
    @Nullable final ReadableMap headers,
    final int id) {
  }

  @ReactMethod
  public void close(int code, String reason, int id) {
  }

  @ReactMethod
  public void send(String message, int id) {
  }

  @ReactMethod
  public void sendBinary(String base64String, int id) {
  }
}
