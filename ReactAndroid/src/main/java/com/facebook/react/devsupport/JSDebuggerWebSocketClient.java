/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.util.JsonReader;
import android.util.JsonToken;
import android.util.JsonWriter;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.JavascriptException;
import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

/** A wrapper around WebSocketClient that recognizes RN debugging message format. */
public class JSDebuggerWebSocketClient extends WebSocketListener {

  private static final String TAG = "JSDebuggerWebSocketClient";

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
    mHttpClient =
        new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read
            .build();

    Request request = new Request.Builder().url(url).build();
    mHttpClient.newWebSocket(request, this);
  }

  public void prepareJSRuntime(JSDebuggerCallback callback) {
    int requestID = mRequestID.getAndIncrement();
    mCallbacks.put(requestID, callback);

    try {
      StringWriter sw = new StringWriter();
      JsonWriter js = new JsonWriter(sw);
      js.beginObject()
          .name("id")
          .value(requestID)
          .name("method")
          .value("prepareJSRuntime")
          .endObject()
          .close();
      sendMessage(requestID, sw.toString());
    } catch (IOException e) {
      triggerRequestFailure(requestID, e);
    }
  }

  public void loadApplicationScript(
      String sourceURL, HashMap<String, String> injectedObjects, JSDebuggerCallback callback) {
    int requestID = mRequestID.getAndIncrement();
    mCallbacks.put(requestID, callback);

    try {
      StringWriter sw = new StringWriter();
      JsonWriter js =
          new JsonWriter(sw)
              .beginObject()
              .name("id")
              .value(requestID)
              .name("method")
              .value("executeApplicationScript")
              .name("url")
              .value(sourceURL)
              .name("inject")
              .beginObject();
      for (String key : injectedObjects.keySet()) {
        js.name(key).value(injectedObjects.get(key));
      }
      js.endObject().endObject().close();
      sendMessage(requestID, sw.toString());
    } catch (IOException e) {
      triggerRequestFailure(requestID, e);
    }
  }

  public void executeJSCall(String methodName, String jsonArgsArray, JSDebuggerCallback callback) {
    int requestID = mRequestID.getAndIncrement();
    mCallbacks.put(requestID, callback);

    try {
      StringWriter sw = new StringWriter();
      JsonWriter js = new JsonWriter(sw);

      js.beginObject().name("id").value(requestID).name("method").value(methodName);
      /* JsonWriter does not offer writing raw string (without quotes), that's why
      here we directly write to output string using the the underlying StringWriter */
      sw.append(",\"arguments\":").append(jsonArgsArray);
      js.endObject().close();
      sendMessage(requestID, sw.toString());
    } catch (IOException e) {
      triggerRequestFailure(requestID, e);
    }
  }

  public void closeQuietly() {
    if (mWebSocket != null) {
      try {
        mWebSocket.close(1000, "End of session");
      } catch (Exception e) {
        // swallow, no need to handle it here
      }
      mWebSocket = null;
    }
  }

  private void sendMessage(int requestID, String message) {
    if (mWebSocket == null) {
      triggerRequestFailure(
          requestID, new IllegalStateException("WebSocket connection no longer valid"));
      return;
    }
    try {
      mWebSocket.send(message);
    } catch (Exception e) {
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
  public void onMessage(WebSocket webSocket, String text) {
    Integer replyID = null;

    try {
      JsonReader reader = new JsonReader(new StringReader(text));
      String result = null;
      reader.beginObject();
      while (reader.hasNext()) {
        String field = reader.nextName();

        if (JsonToken.NULL == reader.peek()) {
          reader.skipValue();
          continue;
        }

        if ("replyID".equals(field)) {
          replyID = reader.nextInt();
        } else if ("result".equals(field)) {
          result = reader.nextString();
        } else if ("error".equals(field)) {
          String error = reader.nextString();
          abort(error, new JavascriptException(error));
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
  public void onFailure(WebSocket webSocket, Throwable t, Response response) {
    abort("Websocket exception", t);
  }

  @Override
  public void onOpen(WebSocket webSocket, Response response) {
    mWebSocket = webSocket;
    Assertions.assertNotNull(mConnectCallback).onSuccess(null);
    mConnectCallback = null;
  }

  @Override
  public void onClosed(WebSocket webSocket, int code, String reason) {
    mWebSocket = null;
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
