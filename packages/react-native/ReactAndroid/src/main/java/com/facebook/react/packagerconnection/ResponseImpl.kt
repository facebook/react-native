/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection

import android.net.Uri
import com.facebook.common.logging.FLog
import com.facebook.react.packagerconnection.JSPackagerClient
import okio.ByteString
import org.json.JSONObject

internal class ResponderImpl(
    private val id: Any,
    private val webSocket: ReconnectingWebSocket
) : Responder {
  override fun respond(result: Any) {
    try {
      val message = JSONObject()
      message.put("version", JSPackagerClient.PROTOCOL_VERSION)
      message.put("id", id)
      message.put("result", result)
      webSocket.sendMessage(message.toString())
    } catch (e: Exception) {
      FLog.e(JSPackagerClient.TAG, "Responding failed", e)
    }
  }

  override fun error(error: Any) {
    try {
      val message = JSONObject()
      message.put("version", JSPackagerClient.PROTOCOL_VERSION)
      message.put("id", id)
      message.put("error", error)
      webSocket.sendMessage(message.toString())
    } catch (e: Exception) {
      FLog.e(JSPackagerClient.TAG, "Responding with error failed", e)
    }
  }
}
