/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.os.Handler;
import android.os.Looper;
import androidx.annotation.Nullable;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import java.io.Closeable;
import java.util.concurrent.TimeUnit;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

/** Java wrapper around a C++ InspectorPackagerConnection. */
/* package */ class CxxInspectorPackagerConnection implements IInspectorPackagerConnection {
  static {
    DevSupportSoLoader.staticInit();
  }

  @DoNotStrip private final HybridData mHybridData;

  public CxxInspectorPackagerConnection(String url, String deviceName, String packageName) {
    mHybridData = initHybrid(url, deviceName, packageName, new DelegateImpl());
  }

  private static native HybridData initHybrid(
      String url, String deviceName, String packageName, DelegateImpl delegate);

  public native void connect();

  public native void closeQuietly();

  public native void sendEventToAllConnections(String event);

  /** Java wrapper around a C++ IWebSocketDelegate, allowing us to call the interface from Java. */
  @DoNotStrip
  private static class WebSocketDelegate implements Closeable {
    private final HybridData mHybridData;

    public native void didFailWithError(@Nullable Integer posixCode, String error);

    public native void didReceiveMessage(String message);

    public native void didOpen();

    public native void didClose();

    /**
     * Release the C++ part of the hybrid WebSocketDelegate object. This should be called when the
     * delegate is not needed anymore ( = the socket will not send more events).
     */
    @Override
    public void close() {
      mHybridData.resetNative();
    }

    @DoNotStrip
    private WebSocketDelegate(HybridData hybridData) {
      mHybridData = hybridData;
    }
  }

  /**
   * Java counterpart of the C++ IWebSocket interface, allowing us to implement the interface in
   * Java.
   */
  private interface IWebSocket extends Closeable {
    void send(String message);

    /**
     * Close the WebSocket connection. NOTE: There is no close() method in the C++ interface.
     * Instead, this method is called when the IWebSocket is destroyed on the C++ side.
     */
    void close();
  }

  /** Java implementation of the C++ InspectorPackagerConnectionDelegate interface. */
  private static class DelegateImpl {
    private final OkHttpClient mHttpClient =
        new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read
            .build();

    private final Handler mHandler = new Handler(Looper.getMainLooper());

    @DoNotStrip
    public IWebSocket connectWebSocket(String url, WebSocketDelegate delegate) {
      Request request = new Request.Builder().url(url).build();
      final WebSocket webSocket =
          mHttpClient.newWebSocket(
              request,
              new WebSocketListener() {
                @Override
                public void onFailure(WebSocket _unused, Throwable t, @Nullable Response response) {
                  scheduleCallback(
                      new Runnable() {
                        public void run() {
                          @Nullable String message = t.getMessage();
                          delegate.didFailWithError(
                              null, message != null ? message : "<Unknown error>");
                          // "No further calls to this listener will be made." -OkHttp docs for
                          // WebSocketListener.onFailure
                          delegate.close();
                        }
                      },
                      0);
                }

                @Override
                public void onMessage(WebSocket _unused, String text) {
                  scheduleCallback(
                      new Runnable() {
                        public void run() {
                          delegate.didReceiveMessage(text);
                        }
                      },
                      0);
                }

                @Override
                public void onOpen(WebSocket _webSocket, Response response) {
                  scheduleCallback(
                      new Runnable() {
                        public void run() {
                          delegate.didOpen();
                        }
                      },
                      0);
                }

                @Override
                public void onClosed(WebSocket _unused, int code, String reason) {
                  scheduleCallback(
                      new Runnable() {
                        public void run() {
                          delegate.didClose();
                          // "No further calls to this listener will be made." -OkHttp docs for
                          // WebSocketListener.onClosed
                          delegate.close();
                        }
                      },
                      0);
                }
              });
      return new IWebSocket() {
        @Override
        public void send(String message) {
          webSocket.send(message);
        }

        @Override
        public void close() {
          webSocket.close(1000, "End of session");
        }
      };
    }

    @DoNotStrip
    public void scheduleCallback(Runnable runnable, long delayMs) {
      mHandler.postDelayed(runnable, delayMs);
    }
  }
}
