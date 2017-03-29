/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the LICENSE file in the root
 * directory of this source tree. An additional grant of patent rights can be found in the PATENTS
 * file in the same directory.
 */

package com.facebook.react.packagerconnection;

import javax.annotation.Nullable;

import java.io.IOException;
import java.nio.channels.ClosedChannelException;
import java.util.concurrent.TimeUnit;

import android.os.Handler;
import android.os.Looper;

import com.facebook.common.logging.FLog;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okhttp3.ws.WebSocket;
import okhttp3.ws.WebSocketCall;
import okhttp3.ws.WebSocketListener;
import okio.Buffer;

/**
 * A wrapper around WebSocketClient that reconnects automatically
 */
final public class ReconnectingWebSocket implements WebSocketListener {
  private static final String TAG = ReconnectingWebSocket.class.getSimpleName();

  private static final int RECONNECT_DELAY_MS = 2000;

  public interface MessageCallback {
    void onMessage(ResponseBody message);
  }

  private final String mUrl;
  private final Handler mHandler;
  private boolean mClosed = false;
  private boolean mSuppressConnectionErrors;
  private @Nullable WebSocket mWebSocket;
  private @Nullable MessageCallback mCallback;

  public ReconnectingWebSocket(String url, MessageCallback callback) {
    super();
    mUrl = url;
    mCallback = callback;
    mHandler = new Handler(Looper.getMainLooper());
  }

  public void connect() {
    if (mClosed) {
      throw new IllegalStateException("Can't connect closed client");
    }

    OkHttpClient httpClient = new OkHttpClient.Builder()
      .connectTimeout(10, TimeUnit.SECONDS)
      .writeTimeout(10, TimeUnit.SECONDS)
      .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read
      .build();

    Request request = new Request.Builder().url(mUrl).build();
    WebSocketCall call = WebSocketCall.create(httpClient, request);
    call.enqueue(this);
  }

  private synchronized void delayedReconnect() {
    // check that we haven't been closed in the meantime
    if (!mClosed) {
      connect();
    }
  }

  private void reconnect() {
    if (mClosed) {
      throw new IllegalStateException("Can't reconnect closed client");
    }

    if (!mSuppressConnectionErrors) {
      FLog.w(TAG, "Couldn't connect to \"" + mUrl + "\", will silently retry");
      mSuppressConnectionErrors = true;
    }

    mHandler.postDelayed(
      new Runnable() {
        @Override
        public void run() {
          delayedReconnect();
        }
      },
      RECONNECT_DELAY_MS);
  }

  public void closeQuietly() {
    mClosed = true;
    closeWebSocketQuietly();
    mCallback = null;
  }

  private void closeWebSocketQuietly() {
    if (mWebSocket != null) {
      try {
        mWebSocket.close(1000, "End of session");
      } catch (IOException e) {
        // swallow, no need to handle it here
      }
      mWebSocket = null;
    }
  }

  private void abort(String message, Throwable cause) {
    FLog.e(TAG, "Error occurred, shutting down websocket connection: " + message, cause);
    closeWebSocketQuietly();
  }

  @Override
  public synchronized void onOpen(WebSocket webSocket, Response response) {
    mWebSocket = webSocket;
    mSuppressConnectionErrors = false;
  }

  @Override
  public synchronized void onFailure(IOException e, Response response) {
    if (mWebSocket != null) {
      abort("Websocket exception", e);
    }
    if (!mClosed) {
      reconnect();
    }
  }

  @Override
  public synchronized void onMessage(ResponseBody message) {
    if (mCallback != null) {
      mCallback.onMessage(message);
    }
  }

  @Override
  public synchronized void onPong(Buffer payload) { }

  @Override
  public synchronized void onClose(int code, String reason) {
    mWebSocket = null;
    if (!mClosed) {
      reconnect();
    }
  }

  public synchronized void sendMessage(RequestBody message) throws IOException {
    if (mWebSocket != null) {
      mWebSocket.sendMessage(message);
    } else {
      throw new ClosedChannelException();
    }
  }
}
