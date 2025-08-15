/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection

import com.facebook.common.logging.FLog

internal abstract class RequestOnlyHandler : RequestHandler {

  abstract override fun onRequest(params: Any?, responder: Responder)

  final override fun onNotification(params: Any?) {
    FLog.e(JSPackagerClient::class.java.simpleName, "Notification is not supported")
  }
}
