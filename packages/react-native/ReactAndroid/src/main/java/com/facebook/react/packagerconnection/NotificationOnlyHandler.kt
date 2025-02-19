/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection

import com.facebook.common.logging.FLog

public abstract class NotificationOnlyHandler : RequestHandler {

  final override fun onRequest(params: Any?, responder: Responder) {
    responder.error("Request is not supported")
    FLog.e(JSPackagerClient::class.java.simpleName, "Request is not supported")
  }

  abstract override fun onNotification(params: Any?)
}
