/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.websocket;

import android.util.Base64;

import java.io.IOException;
import java.lang.IllegalStateException;
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
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.network.ForwardingCookieHandler;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okhttp3.ws.WebSocket;
import okhttp3.ws.WebSocketCall;
import okhttp3.ws.WebSocketListener;

import java.net.URISyntaxException;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.concurrent.TimeUnit;

import okio.Buffer;
import okio.ByteString;

@ReactModule(name = "WebSocketModule")
public class WebSocketModule extends ReactContextBaseJavaModule {

  private final Map<Integer, WebSocket> mWebSocketConnections = new HashMap<>();

  private ReactContext mReactContext;
  private ForwardingCookieHandler mCookieHandler;

  public WebSocketModule(ReactApplicationContext context) {
    super(context);
    mReactContext = context;
    mCookieHandler = new ForwardingCookieHandler(context);
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
  public void connect(
    final String url,
    @Nullable final ReadableArray protocols,
    @Nullable final ReadableMap headers,
    final int id) {
    OkHttpClient client = new OkHttpClient.Builder()
      .connectTimeout(10, TimeUnit.SECONDS)
      .writeTimeout(10, TimeUnit.SECONDS)
      .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read
      .build();

    Request.Builder builder = new Request.Builder()
        .tag(id)
        .url(url);

    String cookie = getCookie(url);
    if (cookie != null) {
      builder.addHeader("Cookie", cookie);
    }

    if (headers != null) {
      ReadableMapKeySetIterator iterator = headers.keySetIterator();

      if (!headers.hasKey("origin")) {
        builder.addHeader("origin", getDefaultOrigin(url));
      }

      while (iterator.hasNextKey()) {
        String key = iterator.nextKey();
        if (ReadableType.String.equals(headers.getType(key))) {
          builder.addHeader(key, headers.getString(key));
        } else {
          FLog.w(
            ReactConstants.TAG,
            "Ignoring: requested " + key + ", value not a string");
        }
      }
    } else {
      builder.addHeader("origin", getDefaultOrigin(url));
    }

    if (protocols != null && protocols.size() > 0) {
      StringBuilder protocolsValue = new StringBuilder("");
      for (int i = 0; i < protocols.size(); i++) {
        String v = protocols.getString(i).trim();
        if (!v.isEmpty() && !v.contains(",")) {
          protocolsValue.append(v);
          protocolsValue.append(",");
        }
      }
      if (protocolsValue.length() > 0) {
        protocolsValue.replace(protocolsValue.length() - 1, protocolsValue.length(), "");
        builder.addHeader("Sec-WebSocket-Protocol", protocolsValue.toString());
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
      public void onMessage(ResponseBody response) throws IOException {
        String message;
        try {
          if (response.contentType() == WebSocket.BINARY) {
            message = Base64.encodeToString(response.source().readByteArray(), Base64.NO_WRAP);
          } else {
            message = response.source().readUtf8();
          }
        } catch (IOException e) {
          notifyWebSocketFailed(id, e.getMessage());
          return;
        }
        try {
          response.source().close();
        } catch (IOException e) {
          FLog.e(
            ReactConstants.TAG,
            "Could not close BufferedSource for WebSocket id " + id,
            e);
        }

        WritableMap params = Arguments.createMap();
        params.putInt("id", id);
        params.putString("data", message);
        params.putString("type", response.contentType() == WebSocket.BINARY ? "binary" : "text");
        sendEvent("websocketMessage", params);
      }
    });

    // Trigger shutdown of the dispatcher's executor so this process can exit cleanly
    client.dispatcher().executorService().shutdown();
  }

  @ReactMethod
  public void close(int code, String reason, int id) {
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // WebSocket is already closed
      // Don't do anything, mirror the behaviour on web
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
      client.sendMessage(RequestBody.create(WebSocket.TEXT, message));
    } catch (IOException | IllegalStateException e) {
      notifyWebSocketFailed(id, e.getMessage());
    }
  }

  @ReactMethod
  public void sendBinary(String base64String, int id) {
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // This is a programmer error
      throw new RuntimeException("Cannot send a message. Unknown WebSocket id " + id);
    }
    try {
      client.sendMessage(
        RequestBody.create(WebSocket.BINARY, ByteString.decodeBase64(base64String)));
    } catch (IOException | IllegalStateException e) {
      notifyWebSocketFailed(id, e.getMessage());
    }
  }

  @ReactMethod
  public void ping(int id) {
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // This is a programmer error
      throw new RuntimeException("Cannot send a message. Unknown WebSocket id " + id);
    }
    try {
      Buffer buffer = new Buffer();
      client.sendPing(buffer);
    } catch (IOException | IllegalStateException e) {
      notifyWebSocketFailed(id, e.getMessage());
    }
  }

  private void notifyWebSocketFailed(int id, String message) {
    WritableMap params = Arguments.createMap();
    params.putInt("id", id);
    params.putString("message", message);
    sendEvent("websocketFailed", params);
  }

  /**
   * Get the default HTTP(S) origin for a specific WebSocket URI
   *
   * @param String uri
   * @return A string of the endpoint converted to HTTP protocol (http[s]://host[:port])
   */

  private static String getDefaultOrigin(String uri) {
    try {
      String defaultOrigin;
      String scheme = "";

      URI requestURI = new URI(uri);
      if (requestURI.getScheme().equals("wss")) {
        scheme += "https";
      } else if (requestURI.getScheme().equals("ws")) {
        scheme += "http";
      } else if (requestURI.getScheme().equals("http") || requestURI.getScheme().equals("https")) {
        scheme += requestURI.getScheme();
      }

      if (requestURI.getPort() != -1) {
        defaultOrigin = String.format(
          "%s://%s:%s",
          scheme,
          requestURI.getHost(),
          requestURI.getPort());
      } else {
        defaultOrigin = String.format("%s://%s/", scheme, requestURI.getHost());
      }

      return defaultOrigin;

    } catch (URISyntaxException e) {
      throw new IllegalArgumentException("Unable to set " + uri + " as default origin header");
    }
  }

  /**
   * Get the cookie for a specific domain
   *
   * @param String uri
   * @return The cookie header or null if none is set
   */
  private String getCookie(String uri) {
    try {
      URI origin = new URI(getDefaultOrigin(uri));
      Map<String, List<String>> cookieMap = mCookieHandler.get(origin, new HashMap());
      List<String> cookieList = cookieMap.get("Cookie");

      if (cookieList == null || cookieList.isEmpty()) {
        return null;
      }

      return cookieList.get(0);
    } catch (URISyntaxException | IOException e) {
      throw new IllegalArgumentException("Unable to get cookie from " + uri);
    }
  }
}
