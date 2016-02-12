/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import javax.annotation.Nullable;

import java.io.IOException;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.TimeUnit;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.Response;
import com.squareup.okhttp.ws.WebSocket;
import com.squareup.okhttp.ws.WebSocketCall;
import com.squareup.okhttp.ws.WebSocketListener;
import okio.Buffer;
import okio.BufferedSource;

/**
 * A wrapper around WebSocketClient that recognizes RN debugging message format.
 */
public class JSDebuggerWebSocketClient implements WebSocketListener {

  private static final String TAG = "JSDebuggerWebSocketClient";
  private static final JsonFactory mJsonFactory = new JsonFactory();

  public interface JSDebuggerCallback {
    void onSuccess(@Nullable String response);
    void onFailure(Throwable cause);
  }

  private @Nullable WebSocket mWebSocket;
  private @Nullable OkHttpClient mHttpClient;
  private @Nullable JSDebuggerCallback mConnectCallback;
  private final AtomicInteger mRequestID = new AtomicInteger();
  private final ConcurrentHashMap<Integer, JSDebuggerCallback> mCallbacks =
      new ConcurrentHashMap<>();

  public void connect(String url, JSDebuggerCallback callback) {
    if (mHttpClient != null) {
      throw new IllegalStateException("JSDebuggerWebSocketClient is already initialized.");
    }
    mConnectCallback = callback;
    mHttpClient = new OkHttpClient();
    mHttpClient.setConnectTimeout(10, TimeUnit.SECONDS);
    mHttpClient.setWriteTimeout(10, TimeUnit.SECONDS);
    // Disable timeouts for read
    mHttpClient.setReadTimeout(0, TimeUnit.MINUTES);

    Request request = new Request.Builder().url(url).build();
    WebSocketCall call = WebSocketCall.create(mHttpClient, request);
    call.enqueue(this);
  }

  /**
   * Creates the next JSON message to send to remote JS executor, with request ID pre-filled in.
   */
  private JsonGenerator startMessageObject(int requestID) throws IOException {
    JsonGenerator jg = mJsonFactory.createGenerator(new StringWriter());
    jg.writeStartObject();
    jg.writeNumberField("id", requestID);
    return jg;
  }

  /**
   * Takes in a JsonGenerator created by {@link #startMessageObject} and returns the stringified
   * JSON
   */
  private String endMessageObject(JsonGenerator jg) throws IOException {
    jg.writeEndObject();
    jg.flush();
    return ((StringWriter) jg.getOutputTarget()).getBuffer().toString();
  }

  public void prepareJSRuntime(JSDebuggerCallback callback) {
    int requestID = mRequestID.getAndIncrement();
    mCallbacks.put(requestID, callback);

    try {
      JsonGenerator jg = startMessageObject(requestID);
      jg.writeStringField("method", "prepareJSRuntime");
      sendMessage(requestID, endMessageObject(jg));
    } catch (IOException e) {
      triggerRequestFailure(requestID, e);
    }
  }

  public void loadApplicationScript(
      String sourceURL,
      HashMap<String, String> injectedObjects,
      JSDebuggerCallback callback) {
    int requestID = mRequestID.getAndIncrement();
    mCallbacks.put(requestID, callback);

    try {
      JsonGenerator jg = startMessageObject(requestID);
      jg.writeStringField("method", "executeApplicationScript");
      jg.writeStringField("url", sourceURL);
      jg.writeObjectFieldStart("inject");
      for (String key : injectedObjects.keySet()) {
        jg.writeObjectField(key, injectedObjects.get(key));
      }
      jg.writeEndObject();
      sendMessage(requestID, endMessageObject(jg));
    } catch (IOException e) {
      triggerRequestFailure(requestID, e);
    }
  }

  public void executeJSCall(
      String methodName,
      String jsonArgsArray,
      JSDebuggerCallback callback) {

    int requestID = mRequestID.getAndIncrement();
    mCallbacks.put(requestID, callback);

    try {
      JsonGenerator jg = startMessageObject(requestID);
      jg.writeStringField("method", methodName);
      jg.writeFieldName("arguments");
      jg.writeRawValue(jsonArgsArray);
      sendMessage(requestID, endMessageObject(jg));
    } catch (IOException e) {
      triggerRequestFailure(requestID, e);
    }
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

  private void sendMessage(int requestID, String message) {
    if (mWebSocket == null) {
      triggerRequestFailure(
          requestID,
          new IllegalStateException("WebSocket connection no longer valid"));
      return;
    }
    Buffer messageBuffer = new Buffer();
    messageBuffer.writeUtf8(message);
    try {
      mWebSocket.sendMessage(WebSocket.PayloadType.TEXT, messageBuffer);
    } catch (IOException e) {
      triggerRequestFailure(requestID, e);
    }
  }

  private void triggerRequestFailure(int requestID, Throwable cause) {
    JSDebuggerCallback callback = mCallbacks.get(requestID);
    if (callback != null) {
      mCallbacks.remove(requestID);
      callback.onFailure(cause);
    }
  }

  private void triggerRequestSuccess(int requestID, @Nullable String response) {
    JSDebuggerCallback callback = mCallbacks.get(requestID);
    if (callback != null) {
      mCallbacks.remove(requestID);
      callback.onSuccess(response);
    }
  }

  @Override
  public void onMessage(BufferedSource payload, WebSocket.PayloadType type) throws IOException {
    if (type != WebSocket.PayloadType.TEXT) {
      FLog.w(TAG, "Websocket received unexpected message with payload of type " + type);
      return;
    }

    String message = null;
    try {
      message = payload.readUtf8();
    } finally {
      payload.close();
    }
    Integer replyID = null;

    try {
      JsonParser parser = new JsonFactory().createParser(message);
      String result = null;
      while (parser.nextToken() != JsonToken.END_OBJECT) {
        String field = parser.getCurrentName();
        if ("replyID".equals(field)) {
          parser.nextToken();
          replyID = parser.getIntValue();
        } else if ("result".equals(field)) {
          parser.nextToken();
          result = parser.getText();
        }
      }
      if (replyID != null) {
        triggerRequestSuccess(replyID, result);
      }
    } catch (IOException e) {
      if (replyID != null) {
        triggerRequestFailure(replyID, e);
      } else {
        abort("Parsing response message from websocket failed", e);
      }
    }
  }

  @Override
  public void onFailure(IOException e, Response response) {
    abort("Websocket exception", e);
  }

  @Override
  public void onOpen(WebSocket webSocket, Response response) {
    mWebSocket = webSocket;
    Assertions.assertNotNull(mConnectCallback).onSuccess(null);
    mConnectCallback = null;
  }

  @Override
  public void onClose(int code, String reason) {
    mWebSocket = null;
  }

  @Override
  public void onPong(Buffer payload) {
    // ignore
  }

  private void abort(String message, Throwable cause) {
    FLog.e(TAG, "Error occurred, shutting down websocket connection: " + message, cause);
    closeQuietly();

    // Trigger failure callbacks
    if (mConnectCallback != null) {
      mConnectCallback.onFailure(cause);
      mConnectCallback = null;
    }
    for (JSDebuggerCallback callback : mCallbacks.values()) {
      callback.onFailure(cause);
    }
    mCallbacks.clear();
  }
}
