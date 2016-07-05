/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the LICENSE file in the root
 * directory of this source tree. An additional grant of patent rights can be found in the PATENTS
 * file in the same directory.
 */

package com.facebook.react.bridge;

import javax.annotation.Nullable;

import java.io.IOException;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.TimeUnit;

import com.facebook.common.logging.FLog;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okhttp3.ws.WebSocket;
import okhttp3.ws.WebSocketCall;
import okhttp3.ws.WebSocketListener;
import okio.Buffer;

/**
 * A wrapper around WebSocketClient that recognizes packager's message format.
 */
public class JSPackagerWebSocketClient implements WebSocketListener {

  private static final String TAG = "JSPackagerWebSocketClient";
  private final String mUrl;

  public interface JSPackagerCallback {
    void onMessage(String target, String action);
  }

  private @Nullable WebSocket mWebSocket;
  private @Nullable JSPackagerCallback mCallback;

  public JSPackagerWebSocketClient(String url, JSPackagerCallback callback) {
    super();
    mUrl = url;
    mCallback = callback;
  }

  public void connect() {
    OkHttpClient  httpClient = new OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read
        .build();

    Request request = new Request.Builder().url(mUrl).build();
    WebSocketCall call = WebSocketCall.create(httpClient, request);
    call.enqueue(this);
  }

  private void reconnect() {
    new Timer().schedule(new TimerTask() {
      @Override
      public void run() {
        connect();
      }
    }, 2000);
  }

  public void closeQuietly() {
    if (mWebSocket != null) {
      try {
        mWebSocket.close(1000, "End of session");
      } catch (IOException e) {
        // swallow, no need to handle it here
      }
      mWebSocket = null;
    }
  }

  private void triggerMessageCallback(String target, String action) {
    if (mCallback != null) {
      mCallback.onMessage(target, action);
    }
  }

  @Override
  public void onMessage(ResponseBody response) throws IOException {
    if (response.contentType() != WebSocket.TEXT) {
      FLog.w(TAG, "Websocket received unexpected message with payload of type " + response.contentType());
      return;
    }

    String message = null;
    try {
      message = response.source().readUtf8();
    } finally {
      response.close();
    }

    try {
      JsonParser parser = new JsonFactory().createParser(message);

      Integer version = null;
      String target = null;
      String action = null;

      while (parser.nextToken() != JsonToken.END_OBJECT) {
        String field = parser.getCurrentName();
        if ("version".equals(field)) {
          parser.nextToken();
          version = parser.getIntValue();
        } else if ("target".equals(field)) {
          parser.nextToken();
          target = parser.getText();
        } else if ("action".equals(field)) {
          parser.nextToken();
          action = parser.getText();
        }
      }
      if (version != 1) {
        return;
      }
      if (target == null || action == null) {
        return;
      }

      triggerMessageCallback(target, action);
    } catch (IOException e) {
      abort("Parsing response message from websocket failed", e);
    }
  }

  @Override
  public void onFailure(IOException e, Response response) {
    abort("Websocket exception", e);
    reconnect();
  }

  @Override
  public void onOpen(WebSocket webSocket, Response response) {
    mWebSocket = webSocket;
  }

  @Override
  public void onClose(int code, String reason) {
    mWebSocket = null;
    reconnect();
  }

  @Override
  public void onPong(Buffer payload) {
    // ignore
  }

  private void abort(String message, Throwable cause) {
    FLog.e(TAG, "Error occurred, shutting down websocket connection: " + message, cause);
    closeQuietly();
  }
}
