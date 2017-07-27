/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.websocket;

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
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import javax.annotation.Nullable;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;

@ReactModule(name = "WebSocketModule", hasConstants = false)
public final class WebSocketModule extends ReactContextBaseJavaModule {

  public interface ContentHandler {
    void onMessage(String text, WritableMap params);

    void onMessage(ByteString byteString, WritableMap params);
  }

  private final Map<Integer, WebSocket> mWebSocketConnections = new HashMap<>();
  private final Map<Integer, ContentHandler> mContentHandlers = new HashMap<>();

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

  public void setContentHandler(final int id, final ContentHandler contentHandler) {
    if (contentHandler != null) {
      mContentHandlers.put(id, contentHandler);
    } else {
      mContentHandlers.remove(id);
    }
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

    Request.Builder builder = new Request.Builder().tag(id).url(url);

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

    client.newWebSocket(
        builder.build(),
        new WebSocketListener() {

          @Override
          public void onOpen(WebSocket webSocket, Response response) {
            mWebSocketConnections.put(id, webSocket);
            WritableMap params = Arguments.createMap();
            params.putInt("id", id);
            sendEvent("websocketOpen", params);
          }

          @Override
          public void onClosed(WebSocket webSocket, int code, String reason) {
            WritableMap params = Arguments.createMap();
            params.putInt("id", id);
            params.putInt("code", code);
            params.putString("reason", reason);
            sendEvent("websocketClosed", params);
          }

          @Override
          public void onFailure(WebSocket webSocket, Throwable t, Response response) {
            notifyWebSocketFailed(id, t.getMessage());
          }

          @Override
          public void onMessage(WebSocket webSocket, String text) {
            WritableMap params = Arguments.createMap();
            params.putInt("id", id);
            params.putString("type", "text");

            ContentHandler contentHandler = mContentHandlers.get(id);
            if (contentHandler != null) {
              contentHandler.onMessage(text, params);
            } else {
              params.putString("data", text);
            }
            sendEvent("websocketMessage", params);
          }

          @Override
          public void onMessage(WebSocket webSocket, ByteString bytes) {
            WritableMap params = Arguments.createMap();
            params.putInt("id", id);
            params.putString("type", "binary");

            ContentHandler contentHandler = mContentHandlers.get(id);
            if (contentHandler != null) {
              contentHandler.onMessage(bytes, params);
            } else {
              String text = bytes.base64();

              params.putString("data", text);
            }

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
      mContentHandlers.remove(id);
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
      client.send(message);
    } catch (Exception e) {
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
      client.send(ByteString.decodeBase64(base64String));
    } catch (Exception e) {
      notifyWebSocketFailed(id, e.getMessage());
    }
  }

  public void sendBinary(ByteString byteString, int id) {
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // This is a programmer error
      throw new RuntimeException("Cannot send a message. Unknown WebSocket id " + id);
    }
    try {
      client.send(byteString);
    } catch (Exception e) {
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
      client.send(ByteString.EMPTY);
    } catch (Exception e) {
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
   * @param uri
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
   * @param uri
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
