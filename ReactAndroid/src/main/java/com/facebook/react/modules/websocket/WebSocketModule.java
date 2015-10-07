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

import java.io.IOException;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.Response;
import com.squareup.okhttp.ws.WebSocket;
import com.squareup.okhttp.ws.WebSocketCall;
import com.squareup.okhttp.ws.WebSocketListener;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import okio.Buffer;
import okio.BufferedSource;

public class WebSocketModule extends ReactContextBaseJavaModule {

  private Map<Integer, WebSocket> mWebSocketConnections = new HashMap<>();
  private ReactContext mReactContext;

  public WebSocketModule(ReactApplicationContext ctx) {
    super(ctx);
    mReactContext = ctx;
  }

  private void sendEvent(String eventName, @Nullable WritableMap params) {
    mReactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
  }

  @Override
  public String getName() {
    return "WebSocketModule";
  }

  @ReactMethod
  public void connect(final String url, final int id) {
    OkHttpClient client = new OkHttpClient();

    client.setConnectTimeout(10, TimeUnit.SECONDS);
    client.setWriteTimeout(10, TimeUnit.SECONDS);
    // Disable timeouts for read
    client.setReadTimeout(0, TimeUnit.MINUTES);

    Request request = new Request.Builder()
        .tag(id)
        .url(url)
        .build();

    WebSocketCall.create(client, request).enqueue(new WebSocketListener() {
      @Override
      public void onOpen(final WebSocket webSocket, final Response response) {
        mWebSocketConnections.put(id, webSocket);

        WritableMap params = Arguments.createMap();
        params.putInt("id", id);
        sendEvent("websocketOpen", params);
      }

      @Override
      public void onMessage(
          final BufferedSource bufferedSource,
          final WebSocket.PayloadType payloadType
      ) {
        String message;

        WritableMap params = Arguments.createMap();
        params.putInt("id", id);

        try {
          message = bufferedSource.readUtf8();
        } catch (IOException e) {
          params.putString("message", e.getMessage());
          sendEvent("websocketFailed", params);

          return;
        }

        params.putString("data", message);

        try {
          bufferedSource.close();
        } catch (IOException e) {
          FLog.e(
            ReactConstants.TAG,
            "Could not close BufferedSource for WebSocket message " + id,
            e);
        }

        sendEvent("websocketMessage", params);
      }

      @Override
      public void onClose(final int code, final String reason) {
        WritableMap params = Arguments.createMap();
        params.putInt("id", id);
        params.putInt("code", code);
        params.putString("reason", reason);
        sendEvent("websocketClosed", params);
      }

      @Override
      public void onFailure(final IOException e, final Response response) {
        WritableMap params = Arguments.createMap();
        params.putInt("id", id);
        params.putString("message", e.getMessage());
        sendEvent("websocketFailed", params);
      }

      @Override
      public void onPong(final Buffer buffer) {
      }
    });

    // Trigger shutdown of the dispatcher's executor so this process can exit cleanly.
    client.getDispatcher().getExecutorService().shutdown();
  }

  @ReactMethod
  public void close(final int code, final String reason, final int id) {
    WebSocket client = mWebSocketConnections.get(id);

    if (client == null) {
      FLog.w(
        ReactConstants.TAG,
        "Could not find WebSocket connection for " + id);
      return;
    }

    try {
      client.close(code, reason);
      mWebSocketConnections.remove(id);
    } catch (Exception e) {
      FLog.e(
        ReactConstants.TAG,
        "Could not close WebSocket connection for " + id,
        e);
    }
  }

  @ReactMethod
  public void send(final String message, final int id) {
    WebSocket client = mWebSocketConnections.get(id);

    try {
      client.sendMessage(
        WebSocket.PayloadType.TEXT,
        new Buffer().writeUtf8(message));
    } catch (IOException e) {
      WritableMap params = Arguments.createMap();
      params.putInt("id", id);
      params.putString("message", e.getMessage());
      sendEvent("websocketFailed", params);
    }
  }
}
