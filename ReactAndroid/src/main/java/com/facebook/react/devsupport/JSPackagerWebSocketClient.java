/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the LICENSE file in the root
 * directory of this source tree. An additional grant of patent rights can be found in the PATENTS
 * file in the same directory.
 */

package com.facebook.react.devsupport;

import javax.annotation.Nullable;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import android.os.Handler;
import android.os.Looper;
import android.util.JsonReader;
import android.util.JsonToken;

import java.io.StringReader;
import com.facebook.common.logging.FLog;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.Buffer;

/**
 * A wrapper around WebSocketClient that recognizes packager's message format.
 */
public class JSPackagerWebSocketClient extends WebSocketListener {
  private static final String TAG = "JSPackagerWebSocketClient";

  private static final int RECONNECT_DELAY_MS = 2000;

  private final String mUrl;
  private final Handler mHandler;
  private boolean mClosed = false;
  private boolean mSuppressConnectionErrors;

  public interface JSPackagerCallback {
    void onMessage(@Nullable WebSocket webSocket, String target, String action);
  }

  private @Nullable WebSocket mWebSocket;
  private @Nullable JSPackagerCallback mCallback;

  public JSPackagerWebSocketClient(String url, JSPackagerCallback callback) {
    super();
    mUrl = url;
    mCallback = callback;
    mHandler = new Handler(Looper.getMainLooper());
  }

  public void connect() {
    if (mClosed) {
      throw new IllegalStateException("Can't connect closed client");
    }
    OkHttpClient  httpClient = new OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read
        .build();

    Request request = new Request.Builder().url(mUrl).build();
    WebSocket call = httpClient.newWebSocket(request, this);
  }

  private void reconnect() {
    if (mClosed) {
      throw new IllegalStateException("Can't reconnect closed client");
    }
    if (!mSuppressConnectionErrors) {
      FLog.w(TAG, "Couldn't connect to packager, will silently retry");
      mSuppressConnectionErrors = true;
    }
    mHandler.postDelayed(
      new Runnable() {
        @Override
        public void run() {
          // check that we haven't been closed in the meantime
          if (!mClosed) {
            connect();
          }
        }
      },
      RECONNECT_DELAY_MS);
  }

  public void closeQuietly() {
    mClosed = true;
    closeWebSocketQuietly();
  }

  private void closeWebSocketQuietly() {
    if (mWebSocket != null) {
      mWebSocket.close(1000, "End of session");
      mWebSocket = null;
    }
  }

  private void triggerMessageCallback(String target, String action) {
    if (mCallback != null) {
      mCallback.onMessage(mWebSocket, target, action);
    }
  }

  @Override 
  public void onMessage(WebSocket webSocket, String text)  {

    try {
      JsonReader reader = new JsonReader(new StringReader(text));

      Integer version = null;
      String target = null;
      String action = null;

      reader.beginObject();
      while (reader.hasNext()) {
        String field = reader.nextName();

        if (JsonToken.NULL == reader.peek()) {
          reader.skipValue();
          continue;
        }

        if ("version".equals(field)) {
          version = reader.nextInt();
        } else if ("target".equals(field)) {
          target = reader.nextString();
        } else if ("action".equals(field)) {
          action = reader.nextString();
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
  public void onFailure(WebSocket webSocket, Throwable t, Response response) {
    if (webSocket != null) {
      abort("Websocket exception", t);
    }
    if (!mClosed) {
      reconnect();
    }
  }

  @Override
  public void onOpen(WebSocket webSocket, Response response) {
    mWebSocket = webSocket;
    mSuppressConnectionErrors = false;
  }

  @Override
  public void onClosing(WebSocket webSocket, int code, String reason) {
    webSocket.close(1000, null);
    mWebSocket = null;
    if (!mClosed) {
      reconnect();
    }
  }


  private void abort(String message, Throwable cause) {
    FLog.e(TAG, "Error occurred, shutting down websocket connection: " + message, cause);
    closeWebSocketQuietly();
  }
}
