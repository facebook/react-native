/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection

import com.facebook.common.logging.FLog

public abstract class NotificationOnlyHandler : RequestHandler {

  override final fun onRequest(params: Any?, responder: Responder) {
    responder.error("Request is not supported")
    FLog.e(JSPackagerClient::class.java.simpleName, "Request is not supported")
  }

  override abstract fun onNotification(params: Any?)
}
