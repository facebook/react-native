/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.websocket;

import android.support.annotation.Nullable;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import java.net.URI;
import java.net.URISyntaxException;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.ArrayList;
import java.util.List;

public class WebSocketModule extends ReactContextBaseJavaModule {
  private WebSocketClient mWebSocketClient;

  private List<WebSocketClient> mWebSocketConnections = new ArrayList<>();

  private ReactContext reactContext;

  public WebSocketModule(ReactApplicationContext ctx) {
    super(ctx);

    reactContext = ctx;
  }

  private void sendEvent(String eventName, @Nullable WritableMap params) {
    reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
  }

  @Override
  public String getName() {
    return "WebSocketManager";
  }

  @ReactMethod
  public void connect(final String host, final int id) {
    URI uri;

    try {
      uri = new URI(host);
    } catch (URISyntaxException e) {
      WritableMap params = Arguments.createMap();

      params.putInt("id", id);

      sendEvent("websocketFailed", params);

      return;
    }

    mWebSocketClient = new WebSocketClient(uri) {
      @Override
      public void onOpen(ServerHandshake serverHandshake) {
        WritableMap params = Arguments.createMap();

        params.putInt("id", id);

        sendEvent("websocketOpen", params);
      }

      @Override
      public void onMessage(String message) {
        WritableMap params = Arguments.createMap();

        params.putInt("id", id);
        params.putString("data", message);

        sendEvent("websocketMessage", params);
      }

      @Override
      public void onClose(
              final int code,
              final String reason,
              final boolean wasClean
      ) {

        WritableMap params = Arguments.createMap();

        params.putInt("id", id);
        params.putInt("code", code);
        params.putString("reason", reason);
        params.putBoolean("wasClean", wasClean);

        sendEvent("websocketClosed", params);
      }

      @Override
      public void onError(Exception e) {
        WritableMap params = Arguments.createMap();

        params.putInt("id", id);
        params.putString("message", e.getMessage());

        sendEvent("websocketFailed", params);
      }
    };

    mWebSocketClient.connect();

    mWebSocketConnections.add(id, mWebSocketClient);
  }

  @ReactMethod
  public void close(final int id) {
    WebSocketClient mWebSocketClient = mWebSocketConnections.get(id);

    if (mWebSocketClient != null) {
      mWebSocketClient.close();
    }
  }

  @ReactMethod
  public void send(final String message, final int id) {
    WebSocketClient mWebSocketClient = mWebSocketConnections.get(id);

    if (mWebSocketClient != null) {
      mWebSocketClient.send(message);
    }
  }
}
