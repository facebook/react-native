/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the LICENSE file in the root
 * directory of this source tree. An additional grant of patent rights can be found in the PATENTS
 * file in the same directory.
 */

package com.facebook.react.packagerconnection;

import javax.annotation.Nullable;

import java.util.Map;

import com.facebook.common.logging.FLog;

import okhttp3.RequestBody;
import okhttp3.ResponseBody;
import okhttp3.ws.WebSocket;

import org.json.JSONObject;

/**
 * A client for packager that uses WebSocket connection.
 */
final public class JSPackagerClient implements ReconnectingWebSocket.MessageCallback {
  private static final String TAG = JSPackagerClient.class.getSimpleName();
  private static final int PROTOCOL_VERSION = 1;

  public class Responder {
    private Object mId;

    public Responder(Object id) {
      mId = id;
    }

    public void respond(Object result) {
      try {
        JSONObject message = new JSONObject();
        message.put("version", PROTOCOL_VERSION);
        message.put("target", "profiler");
        message.put("action", result);
        mWebSocket.sendMessage(RequestBody.create(WebSocket.TEXT, message.toString()));
      } catch (Exception e) {
        FLog.e(TAG, "Responding failed", e);
      }
    }

    public void error(Object error) {
      try {
        JSONObject message = new JSONObject();
        message.put("version", PROTOCOL_VERSION);
        message.put("id", mId);
        message.put("error", error);
        mWebSocket.sendMessage(RequestBody.create(WebSocket.TEXT, message.toString()));
      } catch (Exception e) {
        FLog.e(TAG, "Responding with error failed", e);
      }
    }
  }

  public interface RequestHandler {
    public void onRequest(@Nullable Object params, Responder responder);
    public void onNotification(@Nullable Object params);
  }

  public static abstract class NotificationOnlyHandler implements RequestHandler {
    final public void onRequest(@Nullable Object params, Responder responder) {
      responder.error("Request is not supported");
      FLog.e(TAG, "Request is not supported");
    }
    abstract public void onNotification(@Nullable Object params);
  }

  public static abstract class RequestOnlyHandler implements RequestHandler {
    abstract public void onRequest(@Nullable Object params, Responder responder);
    final public void onNotification(@Nullable Object params) {
      FLog.e(TAG, "Notification is not supported");
    }
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
  public void onMessage(ResponseBody response) {
    if (response.contentType() != WebSocket.TEXT) {
      FLog.w(
        TAG,
        "Websocket received message with payload of unexpected type " + response.contentType());
      return;
    }

    try {
      JSONObject message = new JSONObject(response.string());

      int version = message.optInt("version");
      String target = message.optString("target");
      String action = message.optString("action");

      if (version != PROTOCOL_VERSION) {
        FLog.e(
          TAG,
          "Message with incompatible or missing version of protocol received: " + version);
        return;
      }

      if (!"bridge".equals(target)) {
        return;
      }

      RequestHandler handler = mRequestHandlers.get(action);
      if (handler == null) {
        FLog.e(TAG, "No request handler for action: " + action);
        return;
      }

      if (!"pokeSamplingProfiler".equals(action)) {
        handler.onNotification(null);
      } else {
        handler.onRequest(null, new Responder("profiler"));
      }
    } catch (Exception e) {
      FLog.e(TAG, "Handling the message failed", e);
    } finally {
      response.close();
    }
  }
}
