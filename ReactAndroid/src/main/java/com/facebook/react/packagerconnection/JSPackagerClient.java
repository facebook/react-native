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
import java.util.Map;

import android.util.JsonReader;
import android.util.JsonToken;

import com.facebook.common.logging.FLog;

import okhttp3.ResponseBody;
import okhttp3.ws.WebSocket;

/**
 * A client for packager that uses WebSocket connection.
 */
final public class JSPackagerClient implements ReconnectingWebSocket.MessageCallback {
  private static final String TAG = JSPackagerClient.class.getSimpleName();

  public interface RequestHandler {
    public void onNotification(@Nullable ReconnectingWebSocket.WebSocketSender webSocket);
  }

  private ReconnectingWebSocket mWebSocket;
  private Map<String, RequestHandler> mRequestHandlers;

  public JSPackagerClient(String url, Map<String, RequestHandler> requestHandlers) {
    super();
    mWebSocket = new ReconnectingWebSocket(url, this);
    mRequestHandlers = requestHandlers;
  }

  public void init() {
    mWebSocket.connect();
  }

  public void close() {
    mWebSocket.closeQuietly();
  }

  @Override
  public void onMessage(@Nullable ReconnectingWebSocket.WebSocketSender webSocket, ResponseBody response) {
    if (response.contentType() != WebSocket.TEXT) {
      FLog.w(TAG, "Websocket received unexpected message with payload of type " + response.contentType());
      return;
    }

    try {
      JsonReader reader = new JsonReader(response.charStream());

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
      reader.close();

      if (version == null || target == null || action == null || version != 1) {
        return;
      }

      if ("bridge".equals(target) && mRequestHandlers.containsKey(action)) {
        mRequestHandlers.get(action).onNotification(webSocket);
      }
    } catch (IOException e) {
      FLog.e(TAG, "Parsing response message from websocket failed", e);
    } finally {
      response.close();
    }
  }
}
