/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection

import com.facebook.common.logging.FLog

public abstract class RequestOnlyHandler : RequestHandler {

  override abstract fun onRequest(params: Any?, responder: Responder)

  override final fun onNotification(params: Any?) {
    FLog.e(JSPackagerClient::class.java.simpleName, "Notification is not supported")
  }
}
