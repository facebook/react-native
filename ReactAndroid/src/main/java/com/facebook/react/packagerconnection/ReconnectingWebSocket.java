/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection;

import android.os.Handler;
import android.os.Looper;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import java.io.IOException;
import java.nio.channels.ClosedChannelException;
import java.util.concurrent.TimeUnit;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;

/** A wrapper around WebSocketClient that reconnects automatically */
public final class ReconnectingWebSocket extends WebSocketListener {
  private static final String TAG = ReconnectingWebSocket.class.getSimpleName();

  private static final int RECONNECT_DELAY_MS = 2000;

  public interface MessageCallback {
    void onMessage(String text);

    void onMessage(ByteString bytes);
  }

  public interface ConnectionCallback {
    void onConnected();

    void onDisconnected();
  }

  private final String mUrl;
  private final Handler mHandler;
  private boolean mClosed = false;
  private boolean mSuppressConnectionErrors;
  private @Nullable WebSocket mWebSocket;
  private @Nullable MessageCallback mMessageCallback;
  private @Nullable ConnectionCallback mConnectionCallback;

  public ReconnectingWebSocket(
      String url, MessageCallback messageCallback, ConnectionCallback connectionCallback) {
    super();
    mUrl = url;
    mMessageCallback = messageCallback;
    mConnectionCallback = connectionCallback;
    mHandler = new Handler(Looper.getMainLooper());
  }

  public void connect() {
    if (mClosed) {
      throw new IllegalStateException("Can't connect closed client");
    }

    OkHttpClient httpClient =
        new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read
            .build();

    Request request = new Request.Builder().url(mUrl).build();
    httpClient.newWebSocket(request, this);
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
    mMessageCallback = null;

    if (mConnectionCallback != null) {
      mConnectionCallback.onDisconnected();
    }
  }

  private void closeWebSocketQuietly() {
    if (mWebSocket != null) {
      try {
        mWebSocket.close(1000, "End of session");
      } catch (Exception e) {
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

    if (mConnectionCallback != null) {
      mConnectionCallback.onConnected();
    }
  }

  @Override
  public synchronized void onFailure(WebSocket webSocket, Throwable t, Response response) {
    if (mWebSocket != null) {
      abort("Websocket exception", t);
    }
    if (!mClosed) {
      if (mConnectionCallback != null) {
        mConnectionCallback.onDisconnected();
      }
      reconnect();
    }
  }

  @Override
  public synchronized void onMessage(WebSocket webSocket, String text) {
    if (mMessageCallback != null) {
      mMessageCallback.onMessage(text);
    }
  }

  @Override
  public synchronized void onMessage(WebSocket webSocket, ByteString bytes) {
    if (mMessageCallback != null) {
      mMessageCallback.onMessage(bytes);
    }
  }

  @Override
  public synchronized void onClosed(WebSocket webSocket, int code, String reason) {
    mWebSocket = null;
    if (!mClosed) {
      if (mConnectionCallback != null) {
        mConnectionCallback.onDisconnected();
      }
      reconnect();
    }
  }

  public synchronized void sendMessage(String message) throws IOException {
    if (mWebSocket != null) {
      mWebSocket.send(message);
    } else {
      throw new ClosedChannelException();
    }
  }

  public synchronized void sendMessage(ByteString message) throws IOException {
    if (mWebSocket != null) {
      mWebSocket.send(message);
    } else {
      throw new ClosedChannelException();
    }
  }
}
