/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

/** Dummy implementation of storage module, used for testing */
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
      final int id) {}

  @ReactMethod
  public void close(int code, String reason, int id) {}

  @ReactMethod
  public void send(String message, int id) {}

  @ReactMethod
  public void sendBinary(String base64String, int id) {}
}
