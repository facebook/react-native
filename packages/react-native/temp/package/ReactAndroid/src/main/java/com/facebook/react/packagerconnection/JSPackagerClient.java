/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection;

import android.net.Uri;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers;
import java.util.Map;
import okio.ByteString;
import org.json.JSONObject;

/** A client for packager that uses WebSocket connection. */
public final class JSPackagerClient implements ReconnectingWebSocket.MessageCallback {
  private static final String TAG = JSPackagerClient.class.getSimpleName();
  private static final int PROTOCOL_VERSION = 2;

  private class ResponderImpl implements Responder {
    private Object mId;

    public ResponderImpl(Object id) {
      mId = id;
    }

    public void respond(Object result) {
      try {
        JSONObject message = new JSONObject();
        message.put("version", PROTOCOL_VERSION);
        message.put("id", mId);
        message.put("result", result);
        mWebSocket.sendMessage(message.toString());
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
        mWebSocket.sendMessage(message.toString());
      } catch (Exception e) {
        FLog.e(TAG, "Responding with error failed", e);
      }
    }
  }

  private ReconnectingWebSocket mWebSocket;
  private Map<String, RequestHandler> mRequestHandlers;

  public JSPackagerClient(
      String clientId,
      PackagerConnectionSettings settings,
      Map<String, RequestHandler> requestHandlers) {
    this(clientId, settings, requestHandlers, null);
  }

  public JSPackagerClient(
      String clientId,
      PackagerConnectionSettings settings,
      Map<String, RequestHandler> requestHandlers,
      @Nullable ReconnectingWebSocket.ConnectionCallback connectionCallback) {
    super();

    Uri.Builder builder = new Uri.Builder();
    builder
        .scheme("ws")
        .encodedAuthority(settings.getDebugServerHost())
        .appendPath("message")
        .appendQueryParameter("device", AndroidInfoHelpers.getFriendlyDeviceName())
        .appendQueryParameter("app", settings.getPackageName())
        .appendQueryParameter("clientid", clientId);
    String url = builder.build().toString();

    mWebSocket = new ReconnectingWebSocket(url, this, connectionCallback);
    mRequestHandlers = requestHandlers;
  }

  public void init() {
    mWebSocket.connect();
  }

  public void close() {
    mWebSocket.closeQuietly();
  }

  @Override
  public void onMessage(String text) {
    try {
      JSONObject message = new JSONObject(text);

      int version = message.optInt("version");
      String method = message.optString("method");
      Object id = message.opt("id");
      Object params = message.opt("params");

      if (version != PROTOCOL_VERSION) {
        FLog.e(
            TAG, "Message with incompatible or missing version of protocol received: " + version);
        return;
      }

      if (method == null) {
        abortOnMessage(id, "No method provided");
        return;
      }

      RequestHandler handler = mRequestHandlers.get(method);
      if (handler == null) {
        abortOnMessage(id, "No request handler for method: " + method);
        return;
      }

      if (id == null) {
        handler.onNotification(params);
      } else {
        handler.onRequest(params, new ResponderImpl(id));
      }
    } catch (Exception e) {
      FLog.e(TAG, "Handling the message failed", e);
    }
  }

  @Override
  public void onMessage(ByteString bytes) {
    FLog.w(TAG, "Websocket received message with payload of unexpected type binary");
  }

  private void abortOnMessage(Object id, String reason) {
    if (id != null) {
      (new ResponderImpl(id)).error(reason);
    }

    FLog.e(TAG, "Handling the message failed with reason: " + reason);
  }
}
