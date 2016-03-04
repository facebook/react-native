/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.websocket;

import java.io.IOException;
import javax.annotation.Nullable;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
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

  public WebSocketModule(ReactApplicationContext context) {
    super(context);
    mReactContext = context;
  }

  private void sendEvent(String eventName, WritableMap params) {
    mReactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
  }

  @Override
  public String getName() {
    return "WebSocketModule";
  }

  @ReactMethod
  public void connect(final String url, @Nullable final ReadableArray protocols, @Nullable final ReadableMap options, final int id) {
    // ignoring protocols, since OKHttp overrides them.
    OkHttpClient client = new OkHttpClient();

    client.setConnectTimeout(10, TimeUnit.SECONDS);
    client.setWriteTimeout(10, TimeUnit.SECONDS);
    // Disable timeouts for read
    client.setReadTimeout(0, TimeUnit.MINUTES);

    Request.Builder builder = new Request.Builder()
        .tag(id)
        .url(url);

    if (options != null && options.hasKey("origin")) {
      if (ReadableType.String.equals(options.getType("origin"))) {
        builder.addHeader("Origin", options.getString("origin"));
      } else {
        FLog.w(
          ReactConstants.TAG,
          "Ignoring: requested origin, value not a string");
      }
    }

    WebSocketCall.create(client, builder.build()).enqueue(new WebSocketListener() {

      @Override
      public void onOpen(WebSocket webSocket, Response response) {
        mWebSocketConnections.put(id, webSocket);
        WritableMap params = Arguments.createMap();
        params.putInt("id", id);
        sendEvent("websocketOpen", params);
      }

      @Override
      public void onClose(int code, String reason) {
        WritableMap params = Arguments.createMap();
        params.putInt("id", id);
        params.putInt("code", code);
        params.putString("reason", reason);
        sendEvent("websocketClosed", params);
      }

      @Override
      public void onFailure(IOException e, Response response) {
        notifyWebSocketFailed(id, e.getMessage());
      }

      @Override
      public void onPong(Buffer buffer) {
      }

      @Override
      public void onMessage(BufferedSource bufferedSource, WebSocket.PayloadType payloadType) {
        String message;
        try {
          message = bufferedSource.readUtf8();
        } catch (IOException e) {
          notifyWebSocketFailed(id, e.getMessage());
          return;
        }
        try {
          bufferedSource.close();
        } catch (IOException e) {
          FLog.e(
            ReactConstants.TAG,
            "Could not close BufferedSource for WebSocket id " + id,
            e);
        }

        WritableMap params = Arguments.createMap();
        params.putInt("id", id);
        params.putString("data", message);
        sendEvent("websocketMessage", params);
      }
    });

    // Trigger shutdown of the dispatcher's executor so this process can exit cleanly
    client.getDispatcher().getExecutorService().shutdown();
  }

  @ReactMethod
  public void close(int code, String reason, int id) {
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // WebSocket is already closed
      // Don't do anything, mirror the behaviour on web
      FLog.w(
        ReactConstants.TAG,
        "Cannot close WebSocket. Unknown WebSocket id " + id);

      return;
    }
    try {
      client.close(code, reason);
      mWebSocketConnections.remove(id);
    } catch (Exception e) {
      FLog.e(
        ReactConstants.TAG,
        "Could not close WebSocket connection for id " + id,
        e);
    }
  }

  @ReactMethod
  public void send(String message, int id) {
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // This is a programmer error
      throw new RuntimeException("Cannot send a message. Unknown WebSocket id " + id);
    }
    try {
      client.sendMessage(
        WebSocket.PayloadType.TEXT,
        new Buffer().writeUtf8(message));
    } catch (IOException e) {
      notifyWebSocketFailed(id, e.getMessage());
    }
  }

  private void notifyWebSocketFailed(int id, String message) {
    WritableMap params = Arguments.createMap();
    params.putInt("id", id);
    params.putString("message", message);
    sendEvent("websocketFailed", params);
  }
}
