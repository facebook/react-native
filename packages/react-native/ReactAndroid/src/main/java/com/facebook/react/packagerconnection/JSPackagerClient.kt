/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection

import android.net.Uri
import com.facebook.common.logging.FLog
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers.getFriendlyDeviceName
import com.facebook.react.packagerconnection.ReconnectingWebSocket.MessageCallback
import okio.ByteString
import org.json.JSONObject

/** A client for packager that uses WebSocket connection. */
public class JSPackagerClient @JvmOverloads public constructor(
    clientId: String,
    settings: PackagerConnectionSettings,
    private val requestHandlers: Map<String, RequestHandler>,
    connectionCallback: ReconnectingWebSocket.ConnectionCallback? = null
) : MessageCallback {
  private val webSocket: ReconnectingWebSocket

  init {
    val builder = Uri.Builder()
    builder
      .scheme("ws")
      .encodedAuthority(settings.debugServerHost)
      .appendPath("message")
      .appendQueryParameter("device", getFriendlyDeviceName())
      .appendQueryParameter("app", settings.packageName)
      .appendQueryParameter("clientid", clientId)
    val url = builder.build().toString()

    webSocket = ReconnectingWebSocket(url, this, connectionCallback)
  }

  public fun init() {
    webSocket.connect()
  }

  public fun close() {
    webSocket.closeQuietly()
  }

  override fun onMessage(text: String) {
    try {
      val message = JSONObject(text)

      val version = message.optInt("version")
      val method = message.optString("method")
      val id = message.opt("id")
      val params = message.opt("params")

      if (version != PROTOCOL_VERSION) {
        FLog.e(
          TAG,
          "Message with incompatible or missing version of protocol received: $version"
        )
        return
      }

      if (method == null) {
        abortOnMessage(id, "No method provided")
        return
      }

      val handler = requestHandlers[method]
      if (handler == null) {
        abortOnMessage(id, "No request handler for method: $method")
        return
      }

      if (id == null) {
        handler.onNotification(params)
      } else {
        handler.onRequest(params, ResponderImpl(id, webSocket))
      }
    } catch (e: Exception) {
      FLog.e(TAG, "Handling the message failed", e)
    }
  }

  override fun onMessage(bytes: ByteString) {
    FLog.w(TAG, "Websocket received message with payload of unexpected type binary")
  }

  private fun abortOnMessage(id: Any?, reason: String) {
    if (id != null) {
      (ResponderImpl(id, webSocket)).error(reason)
    }

    FLog.e(TAG, "Handling the message failed with reason: $reason")
  }

  public companion object {
    internal val TAG: String = JSPackagerClient::class.java.simpleName
    internal const val PROTOCOL_VERSION = 2
  }
}
