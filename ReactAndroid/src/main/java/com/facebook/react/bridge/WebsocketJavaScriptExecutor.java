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

import java.util.HashMap;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import android.os.Handler;

import com.facebook.infer.annotation.Assertions;

/**
 * Executes JS remotely via the react nodejs server as a proxy to a browser on the host machine.
 */
public class WebsocketJavaScriptExecutor implements ProxyJavaScriptExecutor.JavaJSExecutor {

  private static final long CONNECT_TIMEOUT_MS = 5000;
  private static final int CONNECT_RETRY_COUNT = 3;

  public interface JSExecutorConnectCallback {
    void onSuccess();
    void onFailure(Throwable cause);
  }

  public static class WebsocketExecutorTimeoutException extends Exception {
    public WebsocketExecutorTimeoutException(String message) {
      super(message);
    }
  }

  private static class JSExecutorCallbackFuture implements
      JSDebuggerWebSocketClient.JSDebuggerCallback {

    private final Semaphore mSemaphore = new Semaphore(0);
    private @Nullable Throwable mCause;
    private @Nullable String mResponse;

    @Override
    public void onSuccess(@Nullable String response) {
      mResponse = response;
      mSemaphore.release();
    }

    @Override
    public void onFailure(Throwable cause) {
      mCause = cause;
      mSemaphore.release();
    }

    /**
     * Call only once per object instance!
     */
    public @Nullable String get() throws Throwable {
      mSemaphore.acquire();
      if (mCause != null) {
        throw mCause;
      }
      return mResponse;
    }
  }

  final private HashMap<String, String> mInjectedObjects = new HashMap<>();
  private @Nullable JSDebuggerWebSocketClient mWebSocketClient;

  public void connect(final String webSocketServerUrl, final JSExecutorConnectCallback callback) {
    final AtomicInteger retryCount = new AtomicInteger(CONNECT_RETRY_COUNT);
    final JSExecutorConnectCallback retryProxyCallback = new JSExecutorConnectCallback() {
      @Override
      public void onSuccess() {
        callback.onSuccess();
      }

      @Override
      public void onFailure(Throwable cause) {
        if (retryCount.decrementAndGet() <= 0) {
          callback.onFailure(cause);
        } else {
          connectInternal(webSocketServerUrl, this);
        }
      }
    };
    connectInternal(webSocketServerUrl, retryProxyCallback);
  }

  private void connectInternal(
      String webSocketServerUrl,
      final JSExecutorConnectCallback callback) {
    final JSDebuggerWebSocketClient client = new JSDebuggerWebSocketClient();
    final Handler timeoutHandler = new Handler();
    client.connect(
        webSocketServerUrl, new JSDebuggerWebSocketClient.JSDebuggerCallback() {
          @Override
          public void onSuccess(@Nullable String response) {
            client.prepareJSRuntime(
                new JSDebuggerWebSocketClient.JSDebuggerCallback() {
                  @Override
                  public void onSuccess(@Nullable String response) {
                    timeoutHandler.removeCallbacksAndMessages(null);
                    mWebSocketClient = client;
                    callback.onSuccess();
                  }

                  @Override
                  public void onFailure(Throwable cause) {
                    timeoutHandler.removeCallbacksAndMessages(null);
                    callback.onFailure(cause);
                  }
                });
          }

          @Override
          public void onFailure(Throwable cause) {
            callback.onFailure(cause);
          }
        });
    timeoutHandler.postDelayed(
        new Runnable() {
          @Override
          public void run() {
            client.closeQuietly();
            callback.onFailure(
                new WebsocketExecutorTimeoutException(
                    "Timeout while connecting to remote debugger"));
          }
        },
        CONNECT_TIMEOUT_MS);
  }

  @Override
  public void close() {
    if (mWebSocketClient != null) {
      mWebSocketClient.closeQuietly();
    }
  }

  @Override
  public void executeApplicationScript(String script, String sourceURL)
      throws ProxyJavaScriptExecutor.ProxyExecutorException {
    JSExecutorCallbackFuture callback = new JSExecutorCallbackFuture();
    Assertions.assertNotNull(mWebSocketClient).executeApplicationScript(
        sourceURL,
        mInjectedObjects,
        callback);
    try {
      callback.get();
    } catch (Throwable cause) {
      throw new ProxyJavaScriptExecutor.ProxyExecutorException(cause);
    }
  }

  @Override
  public @Nullable String executeJSCall(String moduleName, String methodName, String jsonArgsArray)
      throws ProxyJavaScriptExecutor.ProxyExecutorException {
    JSExecutorCallbackFuture callback = new JSExecutorCallbackFuture();
    Assertions.assertNotNull(mWebSocketClient).executeJSCall(
        moduleName,
        methodName,
        jsonArgsArray,
        callback);
    try {
      return callback.get();
    } catch (Throwable cause) {
      throw new ProxyJavaScriptExecutor.ProxyExecutorException(cause);
    }
  }

  @Override
  public void setGlobalVariable(String propertyName, String jsonEncodedValue) {
    // Store and use in the next executeApplicationScript() call.
    mInjectedObjects.put(propertyName, jsonEncodedValue);
  }
}
