/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.websocket;

import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.fbreact.specs.NativeWebSocketModuleSpec;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;

@ReactModule(name = WebSocketModule.NAME, hasConstants = false)
public final class WebSocketModule extends NativeWebSocketModuleSpec {
  public static final String TAG = WebSocketModule.class.getSimpleName();

  public static final String NAME = "WebSocketModule";

  public interface ContentHandler {
    void onMessage(String text, WritableMap params);

    void onMessage(ByteString byteString, WritableMap params);
  }

  private final Map<Integer, WebSocket> mWebSocketConnections = new ConcurrentHashMap<>();
  private final Map<Integer, ContentHandler> mContentHandlers = new ConcurrentHashMap<>();

  private ForwardingCookieHandler mCookieHandler;

  public WebSocketModule(ReactApplicationContext context) {
    super(context);
    mCookieHandler = new ForwardingCookieHandler(context);
  }

  private void sendEvent(String eventName, WritableMap params) {
    ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();

    if (reactApplicationContext != null) {
      reactApplicationContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit(eventName, params);
    }
  }

  @Override
  public String getName() {
    return NAME;
  }

  public void setContentHandler(final int id, final ContentHandler contentHandler) {
    if (contentHandler != null) {
      mContentHandlers.put(id, contentHandler);
    } else {
      mContentHandlers.remove(id);
    }
  }

  @Override
  public void connect(
      final String url,
      @Nullable final ReadableArray protocols,
      @Nullable final ReadableMap options,
      final double socketID) {
    final int id = (int) socketID;
    OkHttpClient client =
        new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read
            .build();

    Request.Builder builder = new Request.Builder().tag(id).url(url);

    String cookie = getCookie(url);
    if (cookie != null) {
      builder.addHeader("Cookie", cookie);
    }

    if (options != null
        && options.hasKey("headers")
        && options.getType("headers").equals(ReadableType.Map)) {

      ReadableMap headers = options.getMap("headers");
      ReadableMapKeySetIterator iterator = headers.keySetIterator();

      if (!headers.hasKey("origin")) {
        builder.addHeader("origin", getDefaultOrigin(url));
      }

      while (iterator.hasNextKey()) {
        String key = iterator.nextKey();
        if (ReadableType.String.equals(headers.getType(key))) {
          builder.addHeader(key, headers.getString(key));
        } else {
          FLog.w(ReactConstants.TAG, "Ignoring: requested " + key + ", value not a string");
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
            params.putString("protocol", response.header("Sec-WebSocket-Protocol", ""));
            sendEvent("websocketOpen", params);
          }

          @Override
          public void onClosing(WebSocket websocket, int code, String reason) {
            websocket.close(code, reason);
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

  @Override
  public void close(double code, String reason, double socketID) {
    int id = (int) socketID;
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // WebSocket is already closed
      // Don't do anything, mirror the behaviour on web
      return;
    }
    try {
      client.close((int) code, reason);
      mWebSocketConnections.remove(id);
      mContentHandlers.remove(id);
    } catch (Exception e) {
      FLog.e(ReactConstants.TAG, "Could not close WebSocket connection for id " + id, e);
    }
  }

  @Override
  public void send(String message, double socketID) {
    final int id = (int) socketID;
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // This is a programmer error -- display development warning
      WritableMap params = Arguments.createMap();
      params.putInt("id", id);
      params.putString("message", "client is null");
      sendEvent("websocketFailed", params);
      params = Arguments.createMap();
      params.putInt("id", id);
      params.putInt("code", 0);
      params.putString("reason", "client is null");
      sendEvent("websocketClosed", params);
      mWebSocketConnections.remove(id);
      mContentHandlers.remove(id);
      return;
    }
    try {
      client.send(message);
    } catch (Exception e) {
      notifyWebSocketFailed(id, e.getMessage());
    }
  }

  @Override
  public void sendBinary(String base64String, double socketID) {
    final int id = (int) socketID;
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // This is a programmer error -- display development warning
      WritableMap params = Arguments.createMap();
      params.putInt("id", id);
      params.putString("message", "client is null");
      sendEvent("websocketFailed", params);
      params = Arguments.createMap();
      params.putInt("id", id);
      params.putInt("code", 0);
      params.putString("reason", "client is null");
      sendEvent("websocketClosed", params);
      mWebSocketConnections.remove(id);
      mContentHandlers.remove(id);
      return;
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
      // This is a programmer error -- display development warning
      WritableMap params = Arguments.createMap();
      params.putInt("id", id);
      params.putString("message", "client is null");
      sendEvent("websocketFailed", params);
      params = Arguments.createMap();
      params.putInt("id", id);
      params.putInt("code", 0);
      params.putString("reason", "client is null");
      sendEvent("websocketClosed", params);
      mWebSocketConnections.remove(id);
      mContentHandlers.remove(id);
      return;
    }
    try {
      client.send(byteString);
    } catch (Exception e) {
      notifyWebSocketFailed(id, e.getMessage());
    }
  }

  @Override
  public void ping(double socketID) {
    final int id = (int) socketID;
    WebSocket client = mWebSocketConnections.get(id);
    if (client == null) {
      // This is a programmer error -- display development warning
      WritableMap params = Arguments.createMap();
      params.putInt("id", id);
      params.putString("message", "client is null");
      sendEvent("websocketFailed", params);
      params = Arguments.createMap();
      params.putInt("id", id);
      params.putInt("code", 0);
      params.putString("reason", "client is null");
      sendEvent("websocketClosed", params);
      mWebSocketConnections.remove(id);
      mContentHandlers.remove(id);
      return;
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
      switch (requestURI.getScheme()) {
        case "wss":
          scheme += "https";
          break;
        case "ws":
          scheme += "http";
          break;
        case "http":
        case "https":
          scheme += requestURI.getScheme();
          break;
        default:
          break;
      }

      if (requestURI.getPort() != -1) {
        defaultOrigin =
            String.format("%s://%s:%s", scheme, requestURI.getHost(), requestURI.getPort());
      } else {
        defaultOrigin = String.format("%s://%s", scheme, requestURI.getHost());
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

  @Override
  public void addListener(String eventName) {}

  @Override
  public void removeListeners(double count) {}
}
